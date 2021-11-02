import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface UserProps {
    id: string;
    name: string;
    login: string;
    avatar_url: string;
}

interface AuthContextDataProps {
    user: UserProps | null;
    signInUrl: string;
    signOut: () => void;
}

interface IAuthProps {
    token: string;
    user: {
      id: string;
      avatar_url: string;
      name: string;
      login: string
    }
  }

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextDataProps);

export function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<UserProps | null>(null)
    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=0b65cd0960b81be16f27`;

    async function signIn(githubCode: string) {
      const response = await api.post<IAuthProps>(`authenticate`, {
        code: githubCode,
      })
      
      const { token, user } = response.data;
      console.log(response)
  
      localStorage.setItem('@dowhile:token', token);

      api.defaults.headers.common.authorization = `Bearer ${token}`;
  
      setUser(user)
    }

    function signOut() {
      setUser(null);
      localStorage.removeItem('@dowhile:token')
    }
  
    useEffect(() => {
        const token = localStorage.getItem('@dowhile:token');

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`;

            api.get<UserProps>(`/profile` ).then((response) => {
                setUser(response.data)
            })
        }
    }, [])

    useEffect(() => {
      const url = window.location.href;
      const hasGithubCode = url.includes('?code=');
  
      if (hasGithubCode) {
        const [ urlWithoutCode, githubCode ] = url.split('?code=')
        window.history.pushState({}, '', urlWithoutCode);
  
        signIn(githubCode)
      }
    }, [])

    return (
        <AuthContext.Provider value={{user, signInUrl, signOut}}>
            {children}
        </AuthContext.Provider>
    )
}