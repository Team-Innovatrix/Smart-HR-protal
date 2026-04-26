'use client';

import { useState, useEffect, useRef } from 'react';
import { useDevSafeUser } from '@/lib/hooks/useDevSafeClerk';
import HRPortalLayout from '@/components/hr/HRPortalLayout';
import { 
  PaperAirplaneIcon, 
  UserCircleIcon, 
  UsersIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Contact {
  clerkUserId: string;
  _id?: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  imageUrl?: string;
}

interface TeamContact {
  _id: string;
  name: string;
  description: string;
}

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  type: 'text' | 'image' | 'file';
}

export default function ChatPage() {
  const { user, isLoaded } = useDevSafeUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teams, setTeams] = useState<TeamContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchContacts();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (selectedContact || selectedTeam) {
      fetchMessages();
      // Poll for messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContact, selectedTeam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/chat/contacts?userId=${user?.id}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.data.users || []);
        setTeams(data.data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      let url = `/api/chat?userId=${user?.id}`;
      const otherId = selectedContact?.clerkUserId || selectedContact?._id;
      if (otherId) url += `&otherId=${otherId}`;
      if (selectedTeam) url += `&groupId=${selectedTeam._id}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || (!selectedContact && !selectedTeam)) return;

    const tmpMsg = newMessage;
    setNewMessage('');

    try {
      const receiverId = selectedContact?.clerkUserId || selectedContact?._id;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          receiverId: receiverId,
          groupId: selectedTeam?._id,
          content: tmpMsg,
          type: 'text'
        })
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoaded || loading) {
    return (
      <HRPortalLayout currentPage="chat">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </HRPortalLayout>
    );
  }

  return (
    <HRPortalLayout currentPage="chat">
      <div className="flex h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden mt-4 animate-fade-in">
        
        {/* Sidebar */}
        <div className="w-80 border-r border-orange-50 flex flex-col bg-orange-50/30">
          <div className="p-6">
            <h1 className="text-2xl font-black text-neutral-900 mb-6 flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-8 h-8 text-orange-600" />
              Messages
            </h1>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className={`h-5 w-5 transition-colors duration-200 ${search ? 'text-orange-500' : 'text-neutral-400'}`} />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border-2 border-orange-100/50 rounded-2xl leading-5 bg-white 
                           placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 
                           sm:text-sm transition-all duration-200 shadow-sm"
                placeholder="Search teammates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {/* Teams / Groups */}
            {teams.length > 0 && (
              <div className="mb-4">
                <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Team Channels</p>
                {teams.map(team => (
                  <button
                    key={team._id}
                    onClick={() => { setSelectedTeam(team); setSelectedContact(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                               ${selectedTeam?._id === team._id 
                                 ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-[1.02]' 
                                 : 'hover:bg-orange-100 text-neutral-700'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                                 ${selectedTeam?._id === team._id ? 'bg-white/20' : 'bg-orange-200 text-orange-700'}`}>
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-sm truncate">{team.name}</p>
                      <p className={`text-[10px] truncate ${selectedTeam?._id === team._id ? 'text-white/70' : 'text-neutral-500'}`}>
                        {team.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Private Messages */}
            <div>
              <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Private Messages</p>
              {filteredContacts.map(contact => {
                const contactId = contact.clerkUserId || contact._id;
                const isSelected = (selectedContact?.clerkUserId || selectedContact?._id) === contactId;
                
                return (
                <button
                  key={contactId}
                  onClick={() => { setSelectedContact(contact); setSelectedTeam(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                             ${isSelected 
                               ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-[1.02]' 
                               : 'hover:bg-orange-100 text-neutral-700'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden
                               ${isSelected ? 'bg-white/20' : 'bg-orange-200 text-orange-700 font-bold'}`}>
                    {contact.imageUrl ? (
                      <img src={contact.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(contact.firstName?.[0] || 'U')}{(contact.lastName?.[0] || 'U')}</span>
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="font-bold text-sm truncate">{contact.firstName || 'Unknown'} {contact.lastName || 'User'}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-white/70' : 'text-neutral-500'}`}>
                      {contact.position || 'Employee'}
                    </p>
                  </div>
                </button>
              )})}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {(selectedContact || selectedTeam) ? (
            <>
              {/* Chat Header */}
              <div className="px-8 py-4 bg-white border-b border-orange-50 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
                    {selectedTeam ? <UsersIcon className="w-6 h-6" /> : <UserCircleIcon className="w-7 h-7" />}
                  </div>
                  <div>
                    <h2 className="font-black text-neutral-900 leading-tight">
                      {selectedTeam ? selectedTeam.name : `${selectedContact?.firstName || 'Unknown'} ${selectedContact?.lastName || 'User'}`}
                    </h2>
                    <p className="text-xs text-orange-500 font-semibold uppercase tracking-tighter">
                      {selectedTeam ? 'Group Channel' : selectedContact?.position}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2.5 rounded-xl hover:bg-orange-50 text-neutral-500 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100">
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-xl hover:bg-orange-50 text-neutral-500 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100">
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-xl hover:bg-orange-50 text-neutral-500 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100">
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-orange-200"
                   style={{backgroundImage: 'radial-gradient(circle, rgba(251,146,60,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                      <ChatBubbleLeftIcon className="w-10 h-10 text-orange-500" />
                    </div>
                    <p className="text-neutral-500 font-bold">No messages yet</p>
                    <p className="text-neutral-400 text-xs">Start the conversation by typing below!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.senderId === user?.id;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

                    return (
                      <div key={msg._id} className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <div className={`w-8 h-8 rounded-lg flex-shrink-0 bg-orange-100 overflow-hidden
                                       ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                            {selectedContact?.imageUrl ? (
                              <img src={selectedContact.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-orange-700">
                                {selectedContact?.firstName?.[0] || 'U'}{selectedContact?.lastName?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-5 py-3 rounded-2xl shadow-sm relative transition-all duration-200 hover:shadow-md
                                       ${isOwn 
                                         ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm' 
                                         : 'bg-white text-neutral-800 border border-orange-50 rounded-bl-sm'}`}>
                            <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                          </div>
                          <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest text-neutral-400 px-1
                                       ${isOwn ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-orange-50">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className="block w-full py-4 px-6 border-2 border-orange-100/50 rounded-2xl leading-5 bg-orange-50/20 
                               placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 
                               text-sm transition-all shadow-inner"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg 
                             hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
                    disabled={!newMessage.trim()}
                  >
                    <PaperAirplaneIcon className="w-6 h-6" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-white border-2 border-orange-200 rounded-3xl 
                           flex items-center justify-center mb-6 shadow-xl animate-float">
                <ChatBubbleLeftIcon className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 mb-2 tracking-tight">Select a Chat</h3>
              <p className="text-neutral-500 max-w-sm text-sm font-medium leading-relaxed">
                Connect with your teammates in real-time. Choose a colleague or group from the sidebar to start talking.
              </p>
            </div>
          )}
        </div>
      </div>
    </HRPortalLayout>
  );
}
