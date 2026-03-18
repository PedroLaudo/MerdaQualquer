import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Upload, Camera, Star, Eye, Utensils, CircleOff, CircleCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import TextMenuRenderer from '../components/menu/TextMenuRenderer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Image Upload Component
const ImageUploader = ({ currentImage, onImageChange }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentImage || '');
  }, [currentImage]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de ficheiro não suportado. Use JPEG, PNG, GIF ou WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ficheiro muito grande. Máximo 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = `${BACKEND_URL}${response.data.url}`;
      onImageChange(imageUrl);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
      setPreview(currentImage || '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#18181B] dark:text-white">Imagem</label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-2 rounded-lg shadow-md transition-all"
              title="Alterar imagem"
            >
              <Camera className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="bg-red-500/90 hover:bg-red-500 p-2 rounded-lg shadow-md transition-all"
              title="Remover imagem"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#1a2342] dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a2342] dark:border-blue-400 mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">A carregar...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Clique para fazer upload</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPEG, PNG, GIF ou WebP (máx. 5MB)</p>
            </>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

const MenuManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New state for menu type
  const [menuType, setMenuType] = useState('image'); // 'image' | 'text'
  const [textMenuTemplate, setTextMenuTemplate] = useState('classic');
  const [loadingMenuConfig, setLoadingMenuConfig] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadData();
    loadMenuConfig();
  }, []);

  const loadMenuConfig = async () => {
    try {
      const response = await axios.get(`${API}/restaurants/${user.restaurant_id}/menu-config`);
      setMenuType(response.data.active_menu_type || 'image');
      setTextMenuTemplate(response.data.text_menu_template || 'classic');
    } catch (error) {
      console.error('Erro ao carregar configuração do menu:', error);
    } finally {
      setLoadingMenuConfig(false);
    }
  };

  const handleMenuTypeChange = async (newType) => {
    try {
      await axios.put(
        `${API}/restaurants/${user.restaurant_id}/menu-config`,
        { active_menu_type: newType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setMenuType(newType);
    } catch (error) {
      console.error('Erro ao atualizar tipo de menu:', error);
      alert('Erro ao atualizar tipo de menu');
    }
  };

  const handleTemplateChange = async (newTemplate) => {
    try {
      await axios.put(
        `${API}/restaurants/${user.restaurant_id}/menu-config`,
        { text_menu_template: newTemplate },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setTextMenuTemplate(newTemplate);
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      alert('Erro ao atualizar template');
    }
  };

  const loadData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API}/categories/restaurant/${user.restaurant_id}`),
        axios.get(`${API}/products/restaurant/${user.restaurant_id}`)
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCategoryModal = (category = null) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const toggleAvailability = async (product) => {
    const newStatus = product.availability_status === 'sold_out' ? 'available' : 'sold_out';
    try {
      await axios.patch(
        `${API}/products/${product.id}/availability`,
        { availability_status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, availability_status: newStatus } : p
      ));
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
      alert('Erro ao alterar disponibilidade');
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedCategory);

  if (loading || loadingMenuConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a2342] dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#18181B] dark:text-white">Gestão de Menu</h1>
      </div>

      {/* Menu Type Toggle + Template Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-[#18181B] dark:text-white mb-4">Tipo de Menu</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => handleMenuTypeChange('image')}
            className={`px-6 py-4 rounded-lg border-2 transition-all ${
              menuType === 'image'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="font-medium">Menu por Imagem</div>
              <div className="text-sm mt-1 opacity-75">
                {menuType === 'image' ? '(Ativo)' : 'Com fotos dos produtos'}
              </div>
            </div>
          </button>

          <button
            onClick={() => handleMenuTypeChange('text')}
            className={`px-6 py-4 rounded-lg border-2 transition-all ${
              menuType === 'text'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Menu por Texto</div>
              <div className="text-sm mt-1 opacity-75">
                {menuType === 'text' ? '(Ativo)' : 'Carta sem fotos'}
              </div>
            </div>
          </button>
        </div>

        {/* Template Selector - Only for text menu */}
        {menuType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Template de Apresentação
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['classic', 'modern', 'cafe'].map((template) => (
                <button
                  key={template}
                  onClick={() => handleTemplateChange(template)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    textMenuTemplate === template
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {template === 'classic' && '📜 Clássico'}
                    {template === 'modern' && '✨ Moderno'}
                    {template === 'cafe' && '☕ Café'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Toggle */}
      {menuType === 'text' && (
        <div className="mb-6">
          <button
            data-testid="toggle-preview-button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Ocultar Preview' : 'Ver Preview do Menu'}
          </button>
          
          {showPreview && (
            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview — Template: <span className="capitalize font-bold">{textMenuTemplate}</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <TextMenuRenderer
                  categories={categories}
                  products={products.filter(p => p.availability_status !== 'sold_out')}
                  template={textMenuTemplate}
                  onAddToCart={() => {}}
                  previewMode={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Product/Category Management (works for both modes) */}
          <div className="flex items-center justify-end gap-3 mb-6">
            <button
              data-testid="add-category-button"
              onClick={() => handleOpenCategoryModal()}
              className="bg-[#10B981] dark:bg-green-700 hover:bg-[#059669] dark:hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Categoria
            </button>
            <button
              data-testid="add-product-button"
              onClick={() => handleOpenProductModal()}
              className="bg-[#1a2342] dark:bg-blue-700 hover:bg-[#0f1529] dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-[#18181B] dark:text-white mb-4">Categorias</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={() => handleOpenCategoryModal(cat)}
                  onDelete={async () => {
                    if (window.confirm('Desativar esta categoria?')) {
                      await axios.delete(`${API}/categories/${cat.id}`);
                      loadData();
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#18181B] dark:text-white">Produtos</h2>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categories={categories}
                  onEdit={() => handleOpenProductModal(product)}
                  onToggleAvailability={() => toggleAvailability(product)}
                  onDelete={async () => {
                    if (window.confirm('Desativar este produto?')) {
                      await axios.delete(`${API}/products/${product.id}`);
                      loadData();
                    }
                  }}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <p className="text-center text-[#71717A] dark:text-gray-400 py-12">Nenhum produto nesta categoria</p>
            )}
          </div>

      {/* Modals */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            loadData();
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          restaurantId={user.restaurant_id}
        />
      )}

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            loadData();
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          restaurantId={user.restaurant_id}
        />
      )}
    </div>
  );
};

const CategoryCard = ({ category, onEdit, onDelete }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700/50 hover:shadow-md transition-all">
      {category.image_url && (
        <img src={category.image_url} alt={category.name} className="w-full h-24 object-cover rounded-lg mb-3" />
      )}
      <h3 className="font-bold text-[#18181B] dark:text-white mb-1">{category.name}</h3>
      <p className="text-sm text-[#71717A] dark:text-gray-400 mb-3 line-clamp-2">{category.description}</p>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ProductCard = ({ product, categories, onEdit, onDelete, onToggleAvailability }) => {
  const category = categories.find(c => c.id === product.category_id);
  const isSoldOut = product.availability_status === 'sold_out';
  
  return (
    <div data-testid={`product-card-${product.id}`} className={`border rounded-lg overflow-hidden hover:shadow-md transition-all ${isSoldOut ? 'border-red-300 dark:border-red-800 opacity-75' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-700/50`}>
      <div className="relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className={`w-full h-32 object-cover ${isSoldOut ? 'grayscale' : ''}`} />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        {/* Availability Badge */}
        <button
          data-testid={`availability-toggle-${product.id}`}
          onClick={(e) => { e.stopPropagation(); onToggleAvailability(); }}
          className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
            isSoldOut
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
          title={isSoldOut ? 'Clique para disponibilizar' : 'Clique para marcar esgotado'}
        >
          {isSoldOut ? <CircleOff className="w-3.5 h-3.5" /> : <CircleCheck className="w-3.5 h-3.5" />}
          {isSoldOut ? 'Esgotado' : 'Disponível'}
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${isSoldOut ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-[#18181B] dark:text-white'}`}>{product.name}</h3>
            {product.highlighted && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <span className={`text-lg font-bold ${isSoldOut ? 'text-gray-400 dark:text-gray-500' : 'text-[#1a2342] dark:text-blue-400'}`}>€{product.price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-[#71717A] dark:text-gray-400 mb-2">{category?.name}</p>
        <p className="text-sm text-[#71717A] dark:text-gray-400 mb-3 line-clamp-2">{product.description}</p>
        {product.extras && product.extras.length > 0 && (
          <p className="text-xs text-[#71717A] dark:text-gray-400 mb-3">
            {product.extras.length} extra(s) disponível(is)
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryModal = ({ category, onClose, onSave, restaurantId }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    display_order: category?.display_order || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (category) {
        await axios.put(`${API}/categories/${category.id}`, {
          ...formData,
          restaurant_id: restaurantId
        });
      } else {
        await axios.post(`${API}/categories`, {
          ...formData,
          restaurant_id: restaurantId
        });
      }
      onSave();
    } catch (error) {
      console.error('Erro ao guardar categoria:', error);
      alert('Erro ao guardar categoria');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#18181B] dark:text-white">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              placeholder="Ex: Hambúrgueres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              rows={3}
              placeholder="Descrição da categoria"
            />
          </div>

          <ImageUploader
            currentImage={formData.image_url}
            onImageChange={(url) => setFormData({...formData, image_url: url})}
          />

          <div>
            <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Ordem de Exibição</label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#1a2342] dark:bg-blue-700 hover:bg-[#0f1529] dark:hover:bg-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductModal = ({ product, categories, onClose, onSave, restaurantId }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image_url: product?.image_url || '',
    category_id: product?.category_id || categories[0]?.id || '',
    extras: product?.extras || [],
    highlighted: product?.highlighted || false,
    display_order: product?.display_order || 0
  });
  const [newExtra, setNewExtra] = useState({ name: '', price: 0 });
  const [saving, setSaving] = useState(false);

  const handleAddExtra = () => {
    if (newExtra.name && newExtra.price > 0) {
      setFormData({
        ...formData,
        extras: [...formData.extras, { ...newExtra, id: Date.now().toString(), active: true }]
      });
      setNewExtra({ name: '', price: 0 });
    }
  };

  const handleRemoveExtra = (id) => {
    setFormData({
      ...formData,
      extras: formData.extras.filter(e => e.id !== id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        restaurant_id: restaurantId,
        price: parseFloat(formData.price)
      };

      if (product) {
        await axios.put(`${API}/products/${product.id}`, payload);
      } else {
        await axios.post(`${API}/products`, payload);
      }
      onSave();
    } catch (error) {
      console.error('Erro ao guardar produto:', error);
      alert('Erro ao guardar produto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#18181B] dark:text-white">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
                placeholder="Ex: Classic Burger"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Categoria *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Preço (€) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              rows={3}
              placeholder="Descrição do produto"
            />
          </div>

          <ImageUploader
            currentImage={formData.image_url}
            onImageChange={(url) => setFormData({...formData, image_url: url})}
          />

          {/* Highlighted + Display Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <input
                type="checkbox"
                id="highlighted"
                data-testid="product-highlighted-checkbox"
                checked={formData.highlighted}
                onChange={(e) => setFormData({...formData, highlighted: e.target.checked})}
                className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
              />
              <label htmlFor="highlighted" className="flex items-center gap-2 text-sm font-medium text-[#18181B] dark:text-white cursor-pointer">
                <Star className="w-4 h-4 text-yellow-500" />
                Destaque
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-2">Ordem</label>
              <input
                type="number"
                data-testid="product-display-order-input"
                value={formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Extras */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <label className="block text-sm font-medium text-[#18181B] dark:text-white mb-3">Extras</label>
            
            {formData.extras.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.extras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{extra.name}</span>
                      <span className="text-[#1a2342] dark:text-blue-400 ml-2">+€{extra.price.toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(extra.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newExtra.name}
                onChange={(e) => setNewExtra({...newExtra, name: e.target.value})}
                placeholder="Nome do extra"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                value={newExtra.price}
                onChange={(e) => setNewExtra({...newExtra, price: parseFloat(e.target.value)})}
                placeholder="Preço"
                className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2342] dark:focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddExtra}
                className="bg-[#10B981] dark:bg-green-700 hover:bg-[#059669] dark:hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#1a2342] dark:bg-blue-700 hover:bg-[#0f1529] dark:hover:bg-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuManagement;
