import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export const useGeneralData = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entities, setEntities] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEntities = async () => {
    try {
      const { data } = await supabase.from('business_entities').select('*').order('is_own_company', { ascending: false });
      if (data) setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEntityField = (id, field, value) => {
    setEntities(entities.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const saveEntity = async (entity) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_entities')
        .update({
          ...entity,
          updated_at: new Date().toISOString()
        })
        .eq('id', entity.id);
      
      if (error) throw error;
      showToast(`Datos de ${entity.name} guardados correctamente`);
    } catch (error) {
      console.error('Error saving entity:', error);
      showToast('Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (entityId, field, file) => {
    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityId}-${field}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath);

      // Update DB immediately
      const { error: updateError } = await supabase
        .from('business_entities')
        .update({ [field]: publicUrl })
        .eq('id', entityId);

      if (updateError) throw updateError;

      setEntities(entities.map(e => e.id === entityId ? { ...e, [field]: publicUrl } : e));
      showToast('Imagen actualizada correctamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir la imagen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (entityId, field) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_entities')
        .update({ [field]: null })
        .eq('id', entityId);

      if (error) throw error;
      setEntities(entities.map(e => e.id === entityId ? { ...e, [field]: null } : e));
      showToast('Imagen eliminada');
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    entities,
    toast,
    updateEntityField,
    saveEntity,
    handleFileUpload,
    removeImage
  };
};
