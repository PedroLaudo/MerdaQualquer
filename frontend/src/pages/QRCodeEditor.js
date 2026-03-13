import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Eye,
  Save,
  Loader2,
  Check,
  ChevronDown,
  Upload,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Color presets
const colorPresets = [
  { name: 'Clássico', bg: '#f8f7f4', text: '#1a2342', qr: '#1a2342' },
  { name: 'Escuro', bg: '#1a2342', text: '#ffffff', qr: '#ffffff' },
  { name: 'Moderno', bg: '#ffffff', text: '#000000', qr: '#000000' },
  { name: 'Elegante', bg: '#2d2d2d', text: '#d4af37', qr: '#d4af37' },
  { name: 'Fresco', bg: '#e8f5e9', text: '#1b5e20', qr: '#1b5e20' },
  { name: 'Oceano', bg: '#e3f2fd', text: '#0d47a1', qr: '#0d47a1' },
  { name: 'Coral', bg: '#fce4ec', text: '#880e4f', qr: '#880e4f' },
  { name: 'Sunset', bg: '#fff3e0', text: '#e65100', qr: '#e65100' },
];

const QRCodeEditor = ({ table, tables, onClose, onSave }) => {
  const { user } = useAuth();
  const printRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [selectedTables, setSelectedTables] = useState([table?.id]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // QR Settings State
  const [settings, setSettings] = useState({
    title: 'SCAN FOR',
    subtitle: 'MENU & ORDER',
    cta_text: 'Aponte a câmara do telemóvel para o código',
    table_prefix: 'TABLE',
    show_logo: true,
    logo_position: 'top',
    layout_style: 'layout1',
    background_color: '#f8f7f4',
    text_color: '#1a2342',
    qr_color: '#1a2342',
    card_style: 'rounded',
    show_instructions: true,
    custom_logo_url: null
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/qr-settings/${user.restaurant_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/qr-settings/${user.restaurant_id}`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSave && onSave(settings);
    } catch (error) {
      console.error('Erro ao guardar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/qr-settings/upload-logo`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      setSettings(prev => ({ ...prev, custom_logo_url: response.data.logo_url }));
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, custom_logo_url: null }));
  };

  const applyColorPreset = (preset) => {
    setSettings(prev => ({
      ...prev,
      background_color: preset.bg,
      text_color: preset.text,
      qr_color: preset.qr
    }));
  };

  const downloadPDF = async () => {
    const tablesToPrint = selectedTables.length > 0 
      ? tables.filter(t => selectedTables.includes(t.id))
      : [table];
    
    // Create print window with all selected tables
    const printWindow = window.open('', '_blank');
    const cardsHTML = tablesToPrint.map(t => generateCardHTML(t)).join('<div class="page-break"></div>');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes | ZentraQR</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              padding: 20px;
              background: #f5f5f5;
            }
            .cards-container {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: center;
            }
            .page-break {
              page-break-after: always;
            }
            @media print {
              body { background: white; padding: 0; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="cards-container">
            ${cardsHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateCardHTML = (tableData) => {
    const logoUrl = settings.custom_logo_url 
      ? `${BACKEND_URL}${settings.custom_logo_url}`
      : `${BACKEND_URL.replace('/api', '')}/logo.png`;
    const qrUrl = `${API}/tables/${tableData.id}/qrcode`;
    const tableLabel = `${settings.table_prefix} ${tableData.table_number}`;
    
    const cardStyles = {
      rounded: 'border-radius: 16px;',
      sharp: 'border-radius: 0;',
      minimal: 'border-radius: 8px; border: 2px solid ' + settings.text_color + ';'
    };
    
    if (settings.layout_style === 'layout1') {
      return `
        <div style="
          background: ${settings.background_color};
          ${cardStyles[settings.card_style]}
          padding: 50px 45px;
          max-width: 360px;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        ">
          ${settings.show_logo && settings.logo_position === 'top' ? `
            <img src="${logoUrl}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 20px;" />
          ` : ''}
          <p style="color: ${settings.text_color}; font-size: 15px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">
            ${settings.title}
          </p>
          <p style="color: ${settings.text_color}; font-size: 15px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px;">
            ${settings.subtitle}
          </p>
          <div style="display: flex; justify-content: center; margin-bottom: 40px;">
            <img src="${qrUrl}" alt="QR Code" style="width: 240px; height: 240px;" />
          </div>
          <p style="color: ${settings.text_color}; font-size: 22px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
            ${tableLabel}
          </p>
          ${settings.show_instructions ? `
            <p style="color: ${settings.text_color}; opacity: 0.7; font-size: 12px; margin-top: 20px;">
              ${settings.cta_text}
            </p>
          ` : ''}
        </div>
      `;
    } else if (settings.layout_style === 'layout2') {
      return `
        <div style="
          background: ${settings.background_color};
          ${cardStyles[settings.card_style]}
          padding: 40px;
          max-width: 360px;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        ">
          ${settings.show_logo ? `
            <img src="${logoUrl}" alt="Logo" style="width: 100px; height: 100px; object-fit: contain; margin-bottom: 30px;" />
          ` : ''}
          <div style="display: flex; justify-content: center; margin-bottom: 30px;">
            <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
          </div>
          <p style="color: ${settings.text_color}; font-size: 18px; font-weight: 700; margin-bottom: 10px;">
            ${settings.title} ${settings.subtitle}
          </p>
          <p style="color: ${settings.text_color}; font-size: 28px; font-weight: 800; letter-spacing: 2px;">
            ${tableLabel}
          </p>
        </div>
      `;
    } else {
      // layout3 - QR grande
      return `
        <div style="
          background: ${settings.background_color};
          ${cardStyles[settings.card_style]}
          padding: 30px;
          max-width: 320px;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        ">
          <div style="display: flex; justify-content: center; margin-bottom: 25px;">
            <img src="${qrUrl}" alt="QR Code" style="width: 260px; height: 260px;" />
          </div>
          <p style="color: ${settings.text_color}; font-size: 32px; font-weight: 800; letter-spacing: 3px;">
            ${tableLabel}
          </p>
          ${settings.show_instructions ? `
            <p style="color: ${settings.text_color}; opacity: 0.6; font-size: 11px; margin-top: 15px;">
              ${settings.cta_text}
            </p>
          ` : ''}
        </div>
      `;
    }
  };

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAllTables = () => {
    setSelectedTables(tables.map(t => t.id));
  };

  const deselectAllTables = () => {
    setSelectedTables([table?.id].filter(Boolean));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a2342]" />
        </div>
      </div>
    );
  }

  const logoUrl = settings.custom_logo_url 
    ? `${BACKEND_URL}${settings.custom_logo_url}`
    : '/logo.png';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden animate-scaleIn flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-[#18181B]">Personalizar QR Code</h2>
            <p className="text-sm text-gray-500 mt-1">Customize o design dos QR Codes do seu restaurante</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor Panel */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {[
                { id: 'content', label: 'Conteúdo', icon: Type },
                { id: 'style', label: 'Estilo', icon: Palette },
                { id: 'layout', label: 'Layout', icon: Layout },
                { id: 'logo', label: 'Logo', icon: ImageIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'text-[#1a2342] border-b-2 border-[#1a2342] bg-white' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {/* Content Tab */}
              {activeTab === 'content' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título Superior
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      placeholder="SCAN FOR"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={settings.subtitle}
                      onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      placeholder="MENU & ORDER"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefixo da Mesa
                    </label>
                    <input
                      type="text"
                      value={settings.table_prefix}
                      onChange={(e) => setSettings(prev => ({ ...prev, table_prefix: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      placeholder="TABLE, Mesa, VIP..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: "TABLE 1", "Mesa 1", "VIP 1"</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instruções (CTA)
                    </label>
                    <textarea
                      value={settings.cta_text}
                      onChange={(e) => setSettings(prev => ({ ...prev, cta_text: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      rows={2}
                      placeholder="Aponte a câmara para o código..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showInstructions"
                      checked={settings.show_instructions}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_instructions: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-[#1a2342] focus:ring-[#1a2342]"
                    />
                    <label htmlFor="showInstructions" className="text-sm text-gray-700">
                      Mostrar instruções no cartão
                    </label>
                  </div>
                </>
              )}

              {/* Style Tab */}
              {activeTab === 'style' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Paletas de Cores
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyColorPreset(preset)}
                          className="p-3 rounded-lg border-2 border-gray-200 hover:border-[#1a2342] transition-all group"
                          title={preset.name}
                        >
                          <div className="flex gap-1 justify-center mb-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bg, border: '1px solid #ddd' }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.text }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.qr }} />
                          </div>
                          <p className="text-xs text-gray-600 group-hover:text-[#1a2342]">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor de Fundo
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={settings.background_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.background_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor do Texto
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={settings.text_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.text_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor do QR Code
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={settings.qr_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, qr_color: e.target.value }))}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.qr_color}
                        onChange={(e) => setSettings(prev => ({ ...prev, qr_color: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2342]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estilo do Cartão
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'rounded', label: 'Arredondado' },
                        { id: 'sharp', label: 'Reto' },
                        { id: 'minimal', label: 'Minimal' },
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setSettings(prev => ({ ...prev, card_style: style.id }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            settings.card_style === style.id 
                              ? 'border-[#1a2342] bg-[#1a2342]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-sm font-medium">{style.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Escolha o Layout
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'layout1', label: 'Clássico', desc: 'Título + QR + Mesa' },
                        { id: 'layout2', label: 'Compacto', desc: 'Logo + QR + Mesa' },
                        { id: 'layout3', label: 'Minimalista', desc: 'QR Grande + Mesa' },
                      ].map(layout => (
                        <button
                          key={layout.id}
                          onClick={() => setSettings(prev => ({ ...prev, layout_style: layout.id }))}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            settings.layout_style === layout.id 
                              ? 'border-[#1a2342] bg-[#1a2342]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-24 rounded-lg mb-3 flex flex-col items-center justify-center gap-1 ${
                            settings.layout_style === layout.id ? 'bg-[#1a2342]/10' : 'bg-gray-100'
                          }`}>
                            {layout.id === 'layout1' && (
                              <>
                                <div className="w-8 h-1 bg-gray-400 rounded" />
                                <div className="w-10 h-10 border-2 border-gray-400 rounded" />
                                <div className="w-6 h-1 bg-gray-400 rounded" />
                              </>
                            )}
                            {layout.id === 'layout2' && (
                              <>
                                <div className="w-6 h-6 bg-gray-400 rounded-full" />
                                <div className="w-8 h-8 border-2 border-gray-400 rounded" />
                                <div className="w-8 h-1 bg-gray-400 rounded" />
                              </>
                            )}
                            {layout.id === 'layout3' && (
                              <>
                                <div className="w-14 h-14 border-2 border-gray-400 rounded" />
                                <div className="w-6 h-1 bg-gray-400 rounded" />
                              </>
                            )}
                          </div>
                          <p className="font-semibold text-sm">{layout.label}</p>
                          <p className="text-xs text-gray-500">{layout.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <input
                      type="checkbox"
                      id="showLogo"
                      checked={settings.show_logo}
                      onChange={(e) => setSettings(prev => ({ ...prev, show_logo: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-[#1a2342] focus:ring-[#1a2342]"
                    />
                    <label htmlFor="showLogo" className="text-sm font-medium text-gray-700">
                      Mostrar logo no cartão QR
                    </label>
                  </div>

                  {settings.show_logo && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Logo Personalizado
                        </label>
                        
                        {settings.custom_logo_url ? (
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <img 
                              src={`${BACKEND_URL}${settings.custom_logo_url}`} 
                              alt="Logo" 
                              className="w-16 h-16 object-contain rounded-lg bg-white p-2"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">Logo carregado</p>
                              <p className="text-xs text-gray-500">Clique para substituir</p>
                            </div>
                            <button
                              onClick={removeLogo}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#1a2342] hover:bg-gray-50 transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            {uploadingLogo ? (
                              <Loader2 className="w-8 h-8 animate-spin text-[#1a2342]" />
                            ) : (
                              <>
                                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                <p className="text-sm font-medium text-gray-700">Carregar Logo</p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                              </>
                            )}
                          </label>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Se não carregar um logo, será usado o logo padrão do ZentraQR
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Posição do Logo
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'top', label: 'Topo do Cartão' },
                            { id: 'center', label: 'Centro do QR' },
                          ].map(pos => (
                            <button
                              key={pos.id}
                              onClick={() => setSettings(prev => ({ ...prev, logo_position: pos.id }))}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                settings.logo_position === pos.id 
                                  ? 'border-[#1a2342] bg-[#1a2342]/5' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className="text-sm font-medium">{pos.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 bg-gray-100 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </h3>
              <p className="text-sm text-gray-500">Mesa: {table?.table_number || '1'}</p>
            </div>

            {/* Live Preview */}
            <div className="flex justify-center mb-6" ref={printRef}>
              <div 
                style={{ 
                  backgroundColor: settings.background_color,
                  borderRadius: settings.card_style === 'rounded' ? '16px' : settings.card_style === 'sharp' ? '0' : '8px',
                  border: settings.card_style === 'minimal' ? `2px solid ${settings.text_color}` : 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  padding: settings.layout_style === 'layout3' ? '30px' : '50px 45px',
                  maxWidth: '360px',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                {/* Layout 1 - Clássico */}
                {settings.layout_style === 'layout1' && (
                  <>
                    {settings.show_logo && settings.logo_position === 'top' && (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-20 h-20 object-contain mx-auto mb-5"
                      />
                    )}
                    <p style={{ color: settings.text_color, fontSize: '15px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {settings.title}
                    </p>
                    <p style={{ color: settings.text_color, fontSize: '15px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '40px' }}>
                      {settings.subtitle}
                    </p>
                    <div className="flex justify-center mb-10">
                      <img 
                        src={table ? `${API}/tables/${table.id}/qrcode` : '/logo.png'} 
                        alt="QR Code" 
                        className="w-60 h-60"
                        style={{ filter: settings.qr_color !== '#1a2342' ? 'none' : 'none' }}
                      />
                    </div>
                    <p style={{ color: settings.text_color, fontSize: '22px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                      {settings.table_prefix} {table?.table_number || '1'}
                    </p>
                    {settings.show_instructions && (
                      <p style={{ color: settings.text_color, opacity: 0.7, fontSize: '12px', marginTop: '20px' }}>
                        {settings.cta_text}
                      </p>
                    )}
                  </>
                )}

                {/* Layout 2 - Compacto */}
                {settings.layout_style === 'layout2' && (
                  <>
                    {settings.show_logo && (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-24 h-24 object-contain mx-auto mb-8"
                      />
                    )}
                    <div className="flex justify-center mb-8">
                      <img 
                        src={table ? `${API}/tables/${table.id}/qrcode` : '/logo.png'} 
                        alt="QR Code" 
                        className="w-52 h-52"
                      />
                    </div>
                    <p style={{ color: settings.text_color, fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
                      {settings.title} {settings.subtitle}
                    </p>
                    <p style={{ color: settings.text_color, fontSize: '28px', fontWeight: 800, letterSpacing: '2px' }}>
                      {settings.table_prefix} {table?.table_number || '1'}
                    </p>
                  </>
                )}

                {/* Layout 3 - Minimalista */}
                {settings.layout_style === 'layout3' && (
                  <>
                    <div className="flex justify-center mb-6">
                      <img 
                        src={table ? `${API}/tables/${table.id}/qrcode` : '/logo.png'} 
                        alt="QR Code" 
                        className="w-64 h-64"
                      />
                    </div>
                    <p style={{ color: settings.text_color, fontSize: '32px', fontWeight: 800, letterSpacing: '3px' }}>
                      {settings.table_prefix} {table?.table_number || '1'}
                    </p>
                    {settings.show_instructions && (
                      <p style={{ color: settings.text_color, opacity: 0.6, fontSize: '11px', marginTop: '15px' }}>
                        {settings.cta_text}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Table Selection for Batch Print */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Mesas para Imprimir</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAllTables}
                    className="text-xs text-[#1a2342] hover:underline"
                  >
                    Selecionar todas
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={deselectAllTables}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {tables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTableSelection(t.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTables.includes(t.id)
                        ? 'bg-[#1a2342] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Mesa {t.table_number}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedTables.length} mesa(s) selecionada(s)
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#1a2342] text-[#1a2342] rounded-xl font-medium hover:bg-[#1a2342]/5 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Guardar Configurações
            </button>
            
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-[#1a2342] text-white rounded-xl font-medium hover:bg-[#0f1529] transition-all"
            >
              <Printer className="w-5 h-5" />
              Imprimir ({selectedTables.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeEditor;
