import * as React from "react";
import "./App.css";
import Router from "./Router";
import ChosenDirectoryContextComponent from "@/contexts/ChosenDirectoryContext";
import FoldersContextComponent from "@/contexts/FoldersContext";

const App: React.FC = () => {
    return (
        <FoldersContextComponent>
            <ChosenDirectoryContextComponent>
                <Router />
            </ChosenDirectoryContextComponent>
        </FoldersContextComponent>
    );
};

export default App;
