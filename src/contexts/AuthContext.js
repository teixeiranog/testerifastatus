import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registrar novo usuário
  const register = async (email, password, userData) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar perfil do usuário
      await updateProfile(user, {
        displayName: userData.nome
      });

      // Salvar dados adicionais no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone,
        tipo_usuario: 'cliente',
        data_criacao: new Date(),
        ativo: true
      });

      toast.success('Conta criada com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      let errorMessage = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este e-mail já está em uso';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido';
          break;
        default:
          errorMessage = 'Erro ao criar conta. Tente novamente.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Login com email e senha
  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Login com Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Verificar se o usuário já existe no Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      
      if (!userDoc.exists()) {
        // Criar documento do usuário se não existir
        await setDoc(doc(db, 'usuarios', user.uid), {
          nome: user.displayName,
          email: user.email,
          telefone: '',
          tipo_usuario: 'cliente',
          data_criacao: new Date(),
          ativo: true,
          provider: 'google'
        });
      }
      
      toast.success('Login com Google realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro no login com Google:', error);
      toast.error('Erro ao fazer login com Google');
      throw error;
    }
  };

  // Login com Facebook
  const loginWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Verificar se o usuário já existe no Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      
      if (!userDoc.exists()) {
        // Criar documento do usuário se não existir
        await setDoc(doc(db, 'usuarios', user.uid), {
          nome: user.displayName,
          email: user.email,
          telefone: '',
          tipo_usuario: 'cliente',
          data_criacao: new Date(),
          ativo: true,
          provider: 'facebook'
        });
      }
      
      toast.success('Login com Facebook realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro no login com Facebook:', error);
      toast.error('Erro ao fazer login com Facebook');
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  // Atualizar dados do usuário
  const updateUserData = async (newData) => {
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'usuarios', currentUser.uid), newData);
        setUserData(prev => ({ ...prev, ...newData }));
        toast.success('Dados atualizados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados');
      throw error;
    }
  };

  // Verificar se é admin
  const isAdmin = () => {
    return userData?.tipo_usuario?.trim() === 'admin';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Buscar dados do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    register,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    updateUserData,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
