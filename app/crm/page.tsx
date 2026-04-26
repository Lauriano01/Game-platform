"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "Novo" | "Em Progresso" | "Fechado" | "Perdido";
  comments: string[];
  createdAt: any;
}

interface Payment {
  id: string;
  option: "message" | "meeting";
  createdAt: any;
  fileName: string | null;
  meetingDetails?: any;
  status: string;
  userPhone: string;
  userId: string;
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Lead["status"] | "Todos">("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userLeads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          status: "Novo" as Lead["status"],
          comments: [],
          createdAt: data.createdAt || serverTimestamp(),
        };
      });

      setLeads(prev => {
        const updated = userLeads.map(u => {
          const existing = prev.find(p => p.id === u.id);
          return existing ? { ...u, status: existing.status, comments: existing.comments } : u;
        });
        const otherLeads = prev.filter(p => !userLeads.some(u => u.id === p.id));
        return [...updated, ...otherLeads];
      });
      setLoading(false);
    });

    const unsubscribeLeads = onSnapshot(collection(db, "leads"), (snapshot) => {
      const leadDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "Novo",
          comments: data.comments || [],
          createdAt: data.createdAt || serverTimestamp(),
        };
      });

      setLeads(prev => {
        const updated = leadDocs.map(l => {
          const existing = prev.find(p => p.id === l.id);
          return existing ? { ...l, comments: existing.comments, status: existing.status } : l;
        });
        const otherLeads = prev.filter(p => !leadDocs.some(l => l.id === p.id));
        return [...updated, ...otherLeads];
      });
      setLoading(false);
    });

    const unsubscribePayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      const paymentDocs: Payment[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          option: data.option,
          createdAt: data.createdAt,
          fileName: data.fileName || null,
          meetingDetails: data.meetingDetails || null,
          status: data.status,
          userPhone: data.userPhone,
          userId: data.userId,
        };
      });
      setPayments(paymentDocs);
    });

    const user = localStorage.getItem("crmUser");
    if (user) {
      const userData = JSON.parse(user);
      setUserEmail(userData.email);
    }

    return () => {
      unsubscribeUsers();
      unsubscribeLeads();
      unsubscribePayments();
    };
  }, []);

  const handleStatusChange = async (leadId: string, status: Lead["status"]) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    try {
      await updateDoc(doc(db, "leads", leadId), { status });
    } catch {}
  };

  const handleAddComment = async (leadId: string) => {
    if (!newComment[leadId]) return;
    const updatedLeads = leads.map(l => {
      if (l.id === leadId) return { ...l, comments: [...l.comments, newComment[leadId]] };
      return l;
    });
    setLeads(updatedLeads);
    setNewComment(prev => ({ ...prev, [leadId]: "" }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("crmUser");
      localStorage.removeItem("crmLogged");
      window.location.href = "/crm-login";
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const filteredLeads = leads
    .filter(l => filterStatus === "Todos" || l.status === filterStatus)
    .filter(l => l.email.toLowerCase().includes(searchTerm.toLowerCase()) || (l.phone || "").includes(searchTerm));

  const getLeadPayments = (leadId: string) => payments.filter(p => p.userId === leadId);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">CRM - Leads</h1>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-700">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="bg-gray-800 text-white px-4 py-2 rounded"
          >
            Filtro Status: {filterStatus}
          </button>
          {showFilterDropdown && (
            <div className="absolute mt-2 bg-black text-white rounded shadow-lg z-50 w-48">
              {["Todos", "Novo", "Em Progresso", "Fechado", "Perdido"].map(status => (
                <div
                  key={status}
                  onClick={() => {
                    setFilterStatus(status as any);
                    setShowFilterDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full gap-2">
          <input
            type="text"
            placeholder="Pesquisar por email ou número"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
            Pesquisar
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-300 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-2 font-semibold text-gray-700 border-b border-gray-300">
          <div>Nome</div>
          <div>Email</div>
          <div>Telefone</div>
          <div>Status</div>
          <div>Comentários</div>
          <div>Data</div>
        </div>

        {loading ? (
          <p className="p-4 text-gray-600">Carregando leads...</p>
        ) : (
          filteredLeads.map((lead) => {
            const leadPayments = getLeadPayments(lead.id);

            const highlightMeeting = leadPayments.some(p => p.option === "meeting");
            const highlightMessage = leadPayments.some(p => p.option === "message");
            const bgColor = highlightMeeting
              ? "bg-blue-200"
              : highlightMessage
              ? "bg-green-200"
              : "";

            return (
              <div key={lead.id}>
                <div
                  onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                  className={`grid grid-cols-2 md:grid-cols-6 gap-2 p-2 border-b border-gray-300 text-black items-center cursor-pointer ${bgColor}`}
                >
                  <div>{lead.name}</div>
                  <div>{lead.email}</div>
                  <div>{lead.phone || "-"}</div>
                  <div>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead["status"])}
                      className="border p-1 rounded text-black w-full"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Em Progresso">Em Progresso</option>
                      <option value="Fechado">Fechado</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </div>
                  <div>
                    {lead.comments.map((c, idx) => (
                      <div key={idx} className="text-sm">- {c}</div>
                    ))}
                  </div>
                  <div>{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : "-"}</div>
                </div>

                {/* Detalhes do pagamento com letras pretas */}
                {expandedLeadId === lead.id && leadPayments.length > 0 && (
                  <div className="p-2 border-b border-gray-300 bg-gray-50">
                    {leadPayments.map(p => (
                      <div key={p.id} className="mb-2 p-2 border rounded bg-gray-100 text-black">
                        <p><strong>Opção:</strong> {p.option}</p>
                        <p><strong>Status:</strong> {p.status}</p>
                        <p><strong>Telefone:</strong> {p.userPhone}</p>
                        <p><strong>CreatedAt:</strong> {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : "-"}</p>
                        {p.option === "meeting" && p.meetingDetails && (
                          <>
                            <p><strong>Data:</strong> {p.meetingDetails.date}</p>
                            <p><strong>Ambiente:</strong> {p.meetingDetails.environment}</p>
                            <p><strong>Expectativa:</strong> {p.meetingDetails.expectation}</p>
                          </>
                        )}
                        {p.fileName && <p><strong>Comprovante:</strong> {p.fileName}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
