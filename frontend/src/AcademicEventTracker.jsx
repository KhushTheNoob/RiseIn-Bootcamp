import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Code, Trophy, Plus, X, MessageSquare } from 'lucide-react';

const AcademicEventTracker = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'workshop',
    date: '',
    description: ''
  });
  const [circles, setCircles] = useState([]);

  useEffect(() => {
    const newCircles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 120 + 40,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-green-400', 'bg-yellow-400'][Math.floor(Math.random() * 5)],
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5
    }));
    setCircles(newCircles);
  }, []);

  const eventTypes = {
    workshop: { icon: Code, color: 'from-blue-500 to-cyan-500', label: 'Workshop' },
    test: { icon: BookOpen, color: 'from-red-500 to-orange-500', label: 'Test' },
    bootcamp: { icon: Trophy, color: 'from-purple-500 to-pink-500', label: 'Bootcamp' },
    seminar: { icon: Calendar, color: 'from-green-500 to-emerald-500', label: 'Seminar' }
  };

  const groupEventsByDate = () => {
    const grouped = {};
    events.forEach(event => {
      const date = new Date(event.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return Object.entries(grouped).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEvent = {
      ...formData,
      id: Date.now()
    };
    setEvents([...events, newEvent]);
    setFormData({ title: '', type: 'workshop', date: '', description: '' });
    setShowModal(false);
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleChatSend = async () => {
  if (!chatInput.trim()) return;

  const userMessage = { role: 'user', content: chatInput };
  setChatMessages(prev => [...prev, userMessage]);
  setChatInput('');

    try {
      // Match backend route and payload shape
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput })
      });

      if (!res.ok) throw new Error('Failed to reach backend: ' + res.status);

      const data = await res.json();
      // backend returns { reply: string, extracted_event?: { title, event_type, date, description } }
      const botText = data.reply || data.response || 'No response received.';
      const botResponse = { role: 'bot', content: botText };
      setChatMessages(prev => [...prev, botResponse]);

      // If backend extracted an event, add it to local events list
      if (data.extracted_event) {
        const ev = data.extracted_event;
        setEvents(prev => [...prev, {
          id: Date.now(),
          title: ev.title || 'Untitled Event',
          type: ev.event_type || 'workshop',
          date: ev.date || new Date().toISOString().slice(0,10),
          description: ev.description || ''
        }]);
      }
    } catch (err) {
    const botResponse = { role: 'bot', content: '⚠️ Error connecting to AI backend.' };
    setChatMessages(prev => [...prev, botResponse]);
    console.error(err);
  }
};

  const groupedEvents = groupEventsByDate();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {circles.map(circle => (
          <div
            key={circle.id}
            className={`absolute rounded-full ${circle.color} opacity-20 blur-3xl`}
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              left: `${circle.x}%`,
              top: `${circle.y}%`,
              animation: `float ${circle.duration}s ease-in-out infinite`,
              animationDelay: `${circle.delay}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-15px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-in {
          animation: slideIn 0.5s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <header className="relative z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              {/* Larger logo with visible colored background and fallback to SVG if PNG missing */}
              <div className="w-20 h-20 rounded-xl shadow-lg transform transition-all duration-300 group-hover:rotate-3 group-hover:scale-105 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-1">
                <div className="bg-white rounded-lg w-full h-full flex items-center justify-center">
                  <img
                    src="/risein-instagram.png"
                    alt="RiseIn Web3 logo"
                    className="object-contain w-14 h-14"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/risein-logo3.svg'; }}
                  />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-black tracking-tight">
                Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sync</span>
              </h1>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Horizontal Scrollable Timeline */}
        <div className="py-12 px-6">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Your Schedule Timeline</h2>
          
          {groupedEvents.length === 0 ? (
            <div className="text-center py-16 animate-slide-in">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center opacity-80 shadow-2xl">
                <Calendar className="w-12 h-12 text-white" />
              </div>
              <p className="text-gray-600 text-lg">No events scheduled yet. Add your first event below!</p>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-x-auto hide-scrollbar pb-6">
                <div className="flex gap-8 px-4" style={{ minWidth: 'max-content' }}>
                  {groupedEvents.map(([date, dayEvents], idx) => {
                    const dateObj = new Date(date);
                    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    const day = dateObj.getDate();
                    const isEven = idx % 2 === 0;
                    
                    return (
                      <div 
                        key={date} 
                        className="flex-shrink-0 animate-scale-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {/* Date Circle Checkpoint - Alternating Up/Down */}
                        <div className={`flex flex-col items-center ${isEven ? 'mb-6' : 'mt-6 flex-col-reverse'}`}>
                          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${eventTypes[dayEvents[0].type].color} shadow-2xl flex flex-col items-center justify-center transform hover:scale-110 transition-all duration-300 cursor-pointer`}>
                            <div className="text-white font-bold text-4xl">{day}</div>
                            <div className="text-white font-semibold text-lg">{month}</div>
                          </div>
                          <div className={`w-1 h-8 bg-gradient-to-b ${isEven ? 'from-gray-300 to-transparent mt-4' : 'from-transparent to-gray-300 mb-4'}`}></div>
                        </div>

                        {/* Events for this date */}
                        <div className={`space-y-4 ${isEven ? '' : 'mt-6'}`} style={{ width: '280px' }}>
                          {dayEvents.map(event => {
                            const EventIcon = eventTypes[event.type].icon;
                            return (
                              <div
                                key={event.id}
                                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group"
                              >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${eventTypes[event.type].color} rounded-full opacity-10 -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`} />
                                
                                <div className="relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className={`bg-gradient-to-br ${eventTypes[event.type].color} w-10 h-10 rounded-lg flex items-center justify-center shadow-md transform group-hover:rotate-12 transition-transform duration-300`}>
                                      <EventIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <button
                                      onClick={() => deleteEvent(event.id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 transform hover:scale-110"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <h3 className="text-lg font-bold text-black mb-1">{event.title}</h3>
                                  <p className="text-xs font-medium text-gray-500 mb-2">{eventTypes[event.type].label}</p>
                                  <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Scroll Hint */}
              <div className="text-center mt-4">
                <p className="text-sm text-gray-400">← Scroll horizontally to see more dates →</p>
              </div>
            </div>
          )}
        </div>

        {/* Add Event Section */}
        <div className="max-w-4xl mx-auto px-6 pb-12">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center">
              <Plus className="w-6 h-6 mr-2" />
              Add New Event
            </h3>

            {/* Toggle Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => { setShowModal(true); setShowChatbot(false); }}
                className="flex-1 bg-black text-white px-6 py-4 rounded-xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                Manual Entry
              </button>
              <button
                onClick={() => { setShowChatbot(true); setShowModal(false); }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Chat with AI
              </button>
            </div>

            {/* Chatbot Interface */}
            {showChatbot && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-scale-in">
                <div className="h-64 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Start chatting to add events naturally!</p>
                      <p className="text-sm mt-2">Try: "Add workshop on Nov 15"</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-black'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    onClick={handleChatSend}
                    className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in transform">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Add New Event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Web Development Workshop"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Event Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {Object.entries(eventTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows="3"
                  placeholder="Brief description of the event..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.title || !formData.date}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicEventTracker;
