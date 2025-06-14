/* ---------------------------- React imports --------------------------- */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/* ---------------------------- Interface/Type imports ------------------ */
import { ChildrenProps } from "@/types/ChildrenProps";

export type UserRole = "authenticated" | "anonymous";

export interface UserProps {
  isAuthenticated: boolean;
  role: UserRole;
}

export interface AuthenticationContextProps {
  user: UserProps;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  handleLogin: () => void;
  handleLogout: () => void;
}

/* ---------------------------- Anonymous User -------------------------- */
const anonymousUser: UserProps = {
  isAuthenticated: false,
  role: "anonymous",
};

/* ---------------------------- Authentication Context ------------------ */
export const AuthenticationContext = createContext<AuthenticationContextProps>({
  user: anonymousUser,
  isLoading: false,
  setIsLoading: () => {},
  handleLogin: () => {},
  handleLogout: () => {},
});

export const useAuthentication = () => useContext(AuthenticationContext);

/* ---------------------------- Provider -------------------------------- */
export const AuthenticationProvider = ({ children }: ChildrenProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProps>(anonymousUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = useCallback(() => {
    const authenticatedUser: UserProps = {
      isAuthenticated: true,
      role: "authenticated",
    };
    setUser(authenticatedUser);
    sessionStorage.setItem("user", JSON.stringify(authenticatedUser));
    if (pathname === "/" || pathname === "/auth") {
      router.push("/authenticated");
    }
  }, [router, pathname]);

  const handleLogout = useCallback(() => {
    setUser(anonymousUser);
    sessionStorage.removeItem("user");
    router.push("/");
  }, [router]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: UserProps = JSON.parse(storedUser);
        if (parsedUser.isAuthenticated && parsedUser.role === "authenticated") {
          handleLogin(); // reapply session
        } else {
          handleLogout(); // clear invalid
        }
      } catch {
        handleLogout();
      }
    } else {
      setUser(anonymousUser);
    }
    setIsLoading(false);
  }, [handleLogin, handleLogout]);

  return (
    <AuthenticationContext.Provider
      value={{
        user,
        isLoading,
        setIsLoading,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
