import React, { useEffect, useState } from 'react';
import { MessageSquare } from "lucide-react";
import { Button } from './ui/button';
import Link from 'next/link';

const SidebarContent: React.FC = () => {
    const [chats, setChats] = useState<any[]>([]);
    useEffect(() => {
        async function fetchChats() {
            try {
                const res = await fetch("http://localhost:5000/chats");
                const data = await res.json();
                if (data) {
                    setChats(data);
                }
            } catch (err) {
                console.error("Error fetching chats:", err);
            }
        }
        fetchChats();
    }, []);
    return (
        <div className="p-4 space-y-4 mt-10 mb-5">
            <div className="flex items-center space-x-2 mb-5">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Recent Chats</span>
            </div>
            <div className="space-y-5">
                {chats.map((chat: any) => (
                    <Link href={`/chat/${chat.id}`} key={chat.id} passHref>
                        <Button
                            variant="ghost"
                            className="w-full justify-start mb-2"
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            {chat.name}
                        </Button>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SidebarContent;
