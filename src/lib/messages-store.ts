import { useState, useEffect } from "react";
import type { Message } from "./types";

const MESSAGES_STORAGE_KEY = "takathamani_messages_v2";

export const INITIAL_SEED_MESSAGES: Message[] = [
  {
    id: "msg-seed-1",
    sender: "Mwangi David (GreenFuel Ltd)",
    sender_role: "buyer",
    recipient_role: "farmer",
    sender_phone: "+254 722 100200",
    listing_title: "Maize Cobs (40 Tons)",
    listing_details: "KSh 17,000/ton · Rongai Farms, Nakuru",
    subject: "Enquiry: 40T Maize Cobs supply contract",
    body: "Hello! We run a bio-briquette plant in Nakuru Industrial Area. Can you guarantee dry delivery of 20 tons next Wednesday?",
    read: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-seed-2",
    sender: "Farmer Joseph (Karatina Coffee Mill)",
    sender_role: "farmer",
    recipient_role: "buyer",
    sender_phone: "+254 721 345678",
    listing_title: "Coffee Husks (35 Tons)",
    listing_details: "KSh 14,500/ton · Karatina Hub, Nyeri",
    subject: "Re: Coffee Husks bulk procurement",
    body: "Hi Sharon! Yes, the 35 tons of Coffee Husks are freshly dried and bagged at the mill ready for loading. Feel free to send your transport or call me to coordinate weighbridge inspection.",
    read: true,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export function getStoredMessages(): Message[] {
  if (typeof window === "undefined") return INITIAL_SEED_MESSAGES;
  try {
    let list: Message[] = INITIAL_SEED_MESSAGES;
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_SEED_MESSAGES));
    } else {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

    // Automatically synchronize farmer sender name with the active farmer account if available
    const farmerRaw = localStorage.getItem("takathamani_active_farmer_account_v1");
    if (farmerRaw) {
      try {
        const farmerObj = JSON.parse(farmerRaw);
        if (farmerObj?.full_name && farmerObj.full_name.trim() !== "New User") {
          const cleanName = farmerObj.full_name.trim();
          const phonePart = farmerObj.phone?.trim();
          const formatted = phonePart ? `${cleanName} (${phonePart})` : cleanName;
          return list.map((m) => {
            if (m.sender_role === "farmer") {
              return {
                ...m,
                sender: formatted,
                sender_phone: phonePart || m.sender_phone,
              };
            }
            return m;
          });
        }
      } catch {
        // ignore JSON parse error
      }
    }

    return list;
  } catch {
    return INITIAL_SEED_MESSAGES;
  }
}

export function saveMessage(input: Omit<Message, "id" | "created_at" | "read"> & { id?: string; read?: boolean }): Message {
  const current = getStoredMessages();
  const newMsg: Message = {
    id: input.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    read: input.read ?? false,
    created_at: new Date().toISOString(),
  };

  const updated = [newMsg, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:messages_updated", { detail: newMsg }));
    } catch (e) {
      console.warn("Could not save message:", e);
    }
  }
  return newMsg;
}

export function markStoredMessageRead(id: string): void {
  const current = getStoredMessages();
  const updated = current.map((m) => (m.id === id ? { ...m, read: true } : m));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:messages_updated"));
    } catch (e) {
      console.warn("Could not mark message read:", e);
    }
  }
}

export function markAllRoleMessagesRead(role: "buyer" | "farmer"): void {
  const current = getStoredMessages();
  let changed = false;
  const updated = current.map((m) => {
    if (!m.read && (!m.recipient_role || m.recipient_role === role)) {
      changed = true;
      return { ...m, read: true };
    }
    return m;
  });
  if (changed && typeof window !== "undefined") {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:messages_updated"));
    } catch (e) {
      console.warn("Could not mark all messages read:", e);
    }
  }
}

/**
 * Update all messages sent by farmers so that the current farmer account
 * name is reflected across the entire app (e.g. in the buyer's messaging inbox).
 */
export function syncFarmerNameAcrossMessages(farmerName: string, farmerPhone?: string): void {
  if (!farmerName || !farmerName.trim() || farmerName.trim() === "New User") return;
  const current = getStoredMessages();
  let changed = false;
  const cleanName = farmerName.trim();
  const phonePart = farmerPhone?.trim();
  const formattedSender = phonePart ? `${cleanName} (${phonePart})` : cleanName;

  const updated = current.map((m) => {
    if (m.sender_role === "farmer") {
      if (m.sender !== formattedSender || (phonePart && m.sender_phone !== phonePart)) {
        changed = true;
        return {
          ...m,
          sender: formattedSender,
          sender_phone: phonePart || m.sender_phone,
        };
      }
    }
    return m;
  });

  if (changed && typeof window !== "undefined") {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:messages_updated"));
    } catch (e) {
      console.warn("Could not sync farmer messages:", e);
    }
  }
}

/**
 * Retroactively update the sender name in all stored local messages.
 * Call this after a profile name change so previously sent messages
 * reflect the user's current name.
 */
export function updateSenderNameInMessages(oldName: string, newName: string, newPhone?: string): void {
  if (!newName || !newName.trim()) return;
  const current = getStoredMessages();
  let changed = false;
  const updated = current.map((m) => {
    // Sender field is "Full Name" or "Full Name (+254...)" pattern
    if (!oldName || m.sender === oldName || m.sender.startsWith(oldName + " ") || m.sender.startsWith(oldName + "(")) {
      changed = true;
      const phonePart = newPhone?.trim() || m.sender_phone;
      return {
        ...m,
        sender: phonePart ? `${newName.trim()} (${phonePart})` : newName.trim(),
        sender_phone: phonePart || m.sender_phone,
      };
    }
    return m;
  });
  if (changed && typeof window !== "undefined") {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("takathamani:messages_updated"));
    } catch (e) {
      console.warn("Could not update sender names:", e);
    }
  }
}

/** Hook to subscribe to messages filtered by the user's active role */
export function useRoleMessages(role: "buyer" | "farmer" = "farmer"): {
  messages: Message[];
  unreadCount: number;
} {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    function load() {
      const all = getStoredMessages();
      // Filter messages meant for this role or general system updates
      const roleFiltered = all.filter((m) => {
        if (!m.recipient_role) return true;
        return m.recipient_role === role;
      });
      setMessages(roleFiltered);
    }

    load();

    function handleUpdate() {
      load();
    }

    window.addEventListener("takathamani:messages_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("takathamani:messages_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [role]);

  const unreadCount = messages.filter((m) => !m.read).length;
  return { messages, unreadCount };
}
