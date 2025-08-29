// Sistema de imagens base64 para salvar diretamente no banco
// Alternativa ao Cloudinary - imagens salvas como base64 no Firestore

/**
 * Converte arquivo de imagem para base64
 * @param {File} file - Arquivo de imagem
 * @returns {Promise<string>} - String base64 da imagem
 */
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      console.error('❌ Erro ao converter imagem:', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Otimiza imagem base64 redimensionando
 * @param {string} base64String - String base64 da imagem
 * @param {number} maxWidth - Largura máxima
 * @param {number} maxHeight - Altura máxima
 * @param {number} quality - Qualidade (0-1)
 * @returns {Promise<string>} - String base64 otimizada
 */
export const optimizeBase64Image = (base64String, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calcular dimensões mantendo proporção
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Preencher fundo branco primeiro
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para base64 com qualidade reduzida
      const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedBase64);
    };
    
    img.onerror = (error) => {
      resolve(base64String); // Retorna original se falhar
    };
    
    img.src = base64String;
  });
};

/**
 * Reprocessa uma imagem existente para corrigir fundo preto para branco
 * @param {string} base64String - String base64 da imagem existente
 * @returns {Promise<string>} - String base64 corrigida com fundo branco
 */
export const reprocessImageWithWhiteBackground = (base64String) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Usar as dimensões originais da imagem
      const width = img.width;
      const height = img.height;
      
      canvas.width = width;
      canvas.height = height;
      
      // Preencher fundo branco primeiro
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Desenhar imagem original
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para base64 mantendo qualidade original
      const correctedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      resolve(correctedBase64);
    };
    
    img.onerror = (error) => {
      resolve(base64String); // Retorna original se falhar
    };
    
    img.src = base64String;
  });
};

/**
 * Verifica se uma imagem precisa ser reprocessada (tem fundo preto)
 * @param {string} base64String - String base64 da imagem
 * @returns {Promise<boolean>} - True se precisa reprocessar
 */
export const needsReprocessing = (base64String) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Criar canvas temporário para análise
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Verificar pixels dos cantos para detectar fundo preto
      const corners = [
        { x: 0, y: 0 },
        { x: img.width - 1, y: 0 },
        { x: 0, y: img.height - 1 },
        { x: img.width - 1, y: img.height - 1 }
      ];
      
      let blackCorners = 0;
      corners.forEach(corner => {
        const pixel = ctx.getImageData(corner.x, corner.y, 1, 1).data;
        // Verificar se o pixel é preto (RGB todos próximos de 0)
        if (pixel[0] < 10 && pixel[1] < 10 && pixel[2] < 10) {
          blackCorners++;
        }
      });
      
      // Se 3 ou mais cantos são pretos, provavelmente tem fundo preto
      const needsReprocess = blackCorners >= 3;
      resolve(needsReprocess);
    };
    
    img.onerror = () => {
      resolve(false); // Em caso de erro, não reprocessar
    };
    
    img.src = base64String;
  });
};

/**
 * Upload de imagem para base64 (substitui Cloudinary)
 * @param {File} file - Arquivo de imagem
 * @param {string} folder - Pasta de destino (não usado, mantido para compatibilidade)
 * @returns {Promise<string>} - String base64 da imagem
 */
export const uploadImage = async (file, folder = 'rifas') => {
  try {
    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 5MB permitido.');
    }
    
    // Validar tipo do arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem.');
    }
    
    // Converter para base64
    const base64 = await convertImageToBase64(file);
    
    // Otimizar imagem
    const optimizedBase64 = await optimizeBase64Image(base64);
    
    return optimizedBase64;
  } catch (error) {
    console.error('❌ Erro ao fazer upload da imagem:', error);
    throw error;
  }
};

/**
 * Deleta uma imagem (não aplicável para base64)
 * @param {string} publicId - ID público da imagem
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export const deleteImage = async (publicId) => {
  console.log('⚠️ Delete não aplicável para imagens base64');
  return true;
};

/**
 * Otimiza URL da imagem (mantém compatibilidade)
 * @param {string} imageUrl - URL ou base64 da imagem
 * @param {object} options - Opções de transformação (não usado)
 * @returns {string} - URL ou base64 original
 */
export const optimizeImage = (imageUrl, options = {}) => {
  // Se já é base64, retorna como está
  if (imageUrl && imageUrl.startsWith('data:image')) {
    return imageUrl;
  }
  
  // Se é URL externa, retorna como está
  return imageUrl;
};
