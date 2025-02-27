import * as React from "react";
import "./App.css";
import Router from "./Router";
import ChosenDirectoryContextComponent from "@/contexts/ChosenDirectoryContext";
import FoldersContextComponent from "@/contexts/FoldersContext";
import { QueryClient, QueryClientContext, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <FoldersContextComponent>
                <ChosenDirectoryContextComponent>
                    <Router />
                </ChosenDirectoryContextComponent>
            </FoldersContextComponent>
        </QueryClientProvider>
    );
};

export default App;
