import { createContext } from "react";

export interface IAppContext {
    baseUrl: string
}

export const AppContext = createContext<IAppContext | undefined>(undefined)