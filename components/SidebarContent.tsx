import React, { useEffect, useState } from "react";
import { Bot, MessageSquare, MoreVertical, Trash } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

// Define the Chat interface
interface Chat {
  id: number;
  name: string;
  created_at: string;
  messages: { id: number; text: string }[]; // Adjust message structure as needed
}

const SidebarContent: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("http://localhost:5000/chats");
        const data: Chat[] = await res.json();
        setChats(data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    }
    fetchChats();
  }, []);

  // Function to handle chat deletion
  const handleDeleteChat = async (chatId: number) => {
    try {
      await fetch(`http://localhost:5000/chat/${chatId}`, { method: "DELETE" });
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-3 mt-4 p-3">
        <Bot className="w-8 h-8 text-primary" />
        <Link href="/">
          <h1 className="text-xl font-semibold">Fitness AI Assistant</h1>
        </Link>
      </div>
      <div className="p-4 space-y-4 mt-2 mb-5">
        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="group flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
            >
              <Link href={`/chat/${chat.id}`} passHref>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {chat.name}
                </Button>
              </Link>
              {/* Dropdown menu appears only on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-2">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)} className="text-red-600">
                      <Trash className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SidebarContent;
