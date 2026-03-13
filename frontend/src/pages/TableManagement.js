import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Plus,
  Download,
  Trash2,
  Users,
  Printer,
  X,
  Check,
  Loader2,
  Settings,
  Palette
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import QRCodeEditor from './QRCodeEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TableManagement = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQREditor, setShowQREditor] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [newTable, setNewTable] = useState({ table_number: '', capacity: 4 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.restaurant_id) {
      loadTables();
    }
  }, [user]);

  const loadTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/tables/restaurant/${user.restaurant_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTables(response.data.filter(t => t.active !== false));
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newTable.table_number.trim()) {
      setError('Número da mesa é obrigatório');
      return;
    }

    // Check if table number already exists
    const exists = tables.some(t => t.table_number === newTable.table_number.trim());
    if (exists) {
      setError('Já existe uma mesa com este número');
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/tables`,
        {
          restaurant_id: user.restaurant_id,
          table_number: newTable.table_number.trim(),
          capacity: parseInt(newTable.capacity) || 4
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Save current tab before reload
      localStorage.setItem('activeTab', 'tables');
      
      // Reload immediately
      window.location.reload();
      
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      setError('Erro ao criar mesa. Tente novamente.');
      setSaving(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Tem certeza que deseja remover esta mesa?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(tables.filter(t => t.id !== tableId));
    } catch (error) {
      console.error('Erro ao remover mesa:', error);
    }
  };

  const handleShowQR = (table) => {
    setSelectedTable(table);
    setShowQRModal(true);
  };

  const downloadQRCode = async (table) => {
    try {
      const response = await fetch(`${API}/tables/${table.id}/qrcode`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-mesa-${table.table_number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
    }
  };

  const printQRCode = (table) => {
    const qrUrl = `${API}/tables/${table.id}/qrcode`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mesa ${table.table_number} | ZentraQR</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #f5f5f0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              padding: 20px;
            }
            .card {
              background: #f8f7f4;
              border-radius: 16px;
              padding: 50px 45px;
              max-width: 360px;
              width: 100%;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            .scan-text {
              color: #1a2342;
              font-size: 15px;
              font-weight: 600;
              letter-spacing: 3px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .order-text {
              color: #1a2342;
              font-size: 15px;
              font-weight: 600;
              letter-spacing: 3px;
              text-transform: uppercase;
              margin-bottom: 40px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin-bottom: 40px;
            }
            .qr-code {
              width: 240px;
              height: 240px;
            }
            .table-label {
              color: #1a2342;
              font-size: 22px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            @media print {
              body { 
                background: white; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .card {
                box-shadow: none;
                max-width: 100%;
                border-radius: 0;
                background: #f8f7f4;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <p class="scan-text">Scan for</p>
            <p class="order-text">Menu & Order</p>
            <div class="qr-container">
              <img src="${qrUrl}" alt="QR Code" class="qr-code" />
            </div>
            <p class="table-label">Table ${table.table_number}</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 800);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#1a2342] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#18181B]">Gestão de Mesas</h1>
        <div className="flex gap-3">
          {tables.length > 0 && (
            <button
              onClick={() => {
                setSelectedTable(tables[0]);
                setShowQREditor(true);
              }}
              className="flex items-center gap-2 bg-white border-2 border-[#1a2342] text-[#1a2342] hover:bg-[#1a2342] hover:text-white px-4 py-2 rounded-lg font-medium transition-all"
              data-testid="customize-qr-button"
            >
              <Palette className="w-5 h-5" />
              Personalizar QR Codes
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#1a2342] hover:bg-[#0f1529] text-white px-4 py-2 rounded-lg font-medium transition-all"
            data-testid="add-table-button"
          >
            <Plus className="w-5 h-5" />
            Adicionar Mesa
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading || refreshing ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 border-4 border-[#1a2342] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#71717A]">{refreshing ? 'A atualizar mesas...' : 'A carregar mesas...'}</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-[#71717A] mb-4">Nenhuma mesa cadastrada</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-[#1a2342] font-medium hover:underline"
          >
            Adicione sua primeira mesa
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table, index) => (
            <div
              key={table.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
            >
              {/* QR Preview */}
              <div 
                className="aspect-square bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all"
                onClick={() => handleShowQR(table)}
              >
                <img
                  src={`${API}/tables/${table.id}/qrcode`}
                  alt={`QR Code Mesa ${table.table_number}`}
                  className="w-4/5 h-4/5 object-contain"
                />
              </div>

              {/* Table Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-[#18181B]">Mesa {table.table_number}</h3>
                  <div className="flex items-center gap-1 text-sm text-[#71717A]">
                    <Users className="w-4 h-4" />
                    <span>{table.capacity}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadQRCode(table)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white rounded-lg text-sm font-medium transition-all"
                    title="Baixar QR Code"
                    data-testid={`download-qr-${table.id}`}
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setShowQREditor(true);
                    }}
                    className="flex items-center justify-center p-2 bg-[#1a2342]/10 hover:bg-[#1a2342]/20 text-[#1a2342] rounded-lg transition-all"
                    title="Personalizar QR Code"
                    data-testid={`customize-qr-${table.id}`}
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => printQRCode(table)}
                    className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                    title="Imprimir QR Code"
                    data-testid={`print-qr-${table.id}`}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                    title="Remover Mesa"
                    data-testid={`delete-table-${table.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#18181B]">Adicionar Mesa</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                  setNewTable({ table_number: '', capacity: 4 });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">
                    Número da Mesa *
                  </label>
                  <input
                    type="text"
                    value={newTable.table_number}
                    onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                    placeholder="Ex: 1, A1, VIP..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342] focus:border-transparent"
                    data-testid="table-number-input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#18181B] mb-2">
                    Capacidade (lugares)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342] focus:border-transparent"
                    data-testid="table-capacity-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setNewTable({ table_number: '', capacity: 4 });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1a2342] hover:bg-[#0f1529] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  data-testid="save-table-button"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      A criar...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Criar Mesa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Preview Modal - Print Ready Design */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowQRModal(false);
                setSelectedTable(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white shadow-md z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Print-ready QR Card */}
            <div id="qr-print-area" className="bg-gradient-to-br from-[#1a2342] to-[#2d3a5c] p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img 
                  src="/logo.png" 
                  alt="ZentraQR" 
                  className="w-20 h-20 object-contain"
                />
              </div>

              {/* QR Code Container */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-xl border-4 border-[#1a2342]/10">
                    <img
                      src={`${API}/tables/${selectedTable.id}/qrcode`}
                      alt={`QR Code Mesa ${selectedTable.table_number}`}
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Table Info */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Mesa</p>
                  <p className="text-4xl font-bold text-[#1a2342]">{selectedTable.table_number}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 text-center">
                <p className="text-white/90 text-sm font-medium mb-2">
                  📱 Leia o QR Code para fazer o pedido
                </p>
                <p className="text-white/60 text-xs">
                  Aponte a câmara do telemóvel para o código
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => downloadQRCode(selectedTable)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border-2 border-[#1a2342] text-[#1a2342] hover:bg-[#1a2342] hover:text-white transition-all"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={() => printQRCode(selectedTable)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white bg-[#1a2342] hover:bg-[#0f1529] transition-all"
              >
                <Printer className="w-5 h-5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Editor Modal */}
      {showQREditor && (
        <QRCodeEditor
          table={selectedTable}
          tables={tables}
          onClose={() => {
            setShowQREditor(false);
            setSelectedTable(null);
          }}
          onSave={() => {
            // Settings saved
          }}
        />
      )}
    </div>
  );
};

export default TableManagement;
