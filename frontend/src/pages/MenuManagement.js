import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5500]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#18181B]">Gestão de Menu</h1>
        <div className="flex gap-3">
          <button
            data-testid="add-category-button"
            onClick={() => handleOpenCategoryModal()}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
          <button
            data-testid="add-product-button"
            onClick={() => handleOpenProductModal()}
            className="bg-[#FF5500] hover:bg-[#CC4400] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-[#18181B] mb-4">Categorias</h2>
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#18181B]">Produtos</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
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
          <p className="text-center text-[#71717A] py-12">Nenhum produto nesta categoria</p>
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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
      {category.image_url && (
        <img src={category.image_url} alt={category.name} className="w-full h-24 object-cover rounded-lg mb-3" />
      )}
      <h3 className="font-bold text-[#18181B] mb-1">{category.name}</h3>
      <p className="text-sm text-[#71717A] mb-3 line-clamp-2">{category.description}</p>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ProductCard = ({ product, categories, onEdit, onDelete }) => {
  const category = categories.find(c => c.id === product.category_id);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-[#18181B]">{product.name}</h3>
          <span className="text-lg font-bold text-[#FF5500]">€{product.price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-[#71717A] mb-2">{category?.name}</p>
        <p className="text-sm text-[#71717A] mb-3 line-clamp-2">{product.description}</p>
        {product.extras && product.extras.length > 0 && (
          <p className="text-xs text-[#71717A] mb-3">
            {product.extras.length} extra(s) disponível(is)
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-all"
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
      <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#18181B]">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              placeholder="Ex: Hambúrgueres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              rows={3}
              placeholder="Descrição da categoria"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">URL da Imagem</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">Ordem de Exibição</label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#FF5500] hover:bg-[#CC4400] text-white px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
    extras: product?.extras || []
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#18181B]">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#18181B] mb-2">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                placeholder="Ex: Classic Burger"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18181B] mb-2">Categoria *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#18181B] mb-2">Preço (€) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              rows={3}
              placeholder="Descrição do produto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181B] mb-2">URL da Imagem</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          {/* Extras */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-[#18181B] mb-3">Extras</label>
            
            {formData.extras.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.extras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{extra.name}</span>
                      <span className="text-[#FF5500] ml-2">+€{extra.price.toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(extra.id)}
                      className="text-red-600 hover:text-red-700"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              />
              <input
                type="number"
                step="0.01"
                value={newExtra.price}
                onChange={(e) => setNewExtra({...newExtra, price: parseFloat(e.target.value)})}
                placeholder="Preço"
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
              />
              <button
                type="button"
                onClick={handleAddExtra}
                className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#FF5500] hover:bg-[#CC4400] text-white px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
