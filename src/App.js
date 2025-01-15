import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Routes , Route } from "react-router-dom";
import AppPage from "./page/App";
import CustPage from "./page/CustomerBot";

const App = () => {
  return(
    <Routes>
      <Route path="/" element={<AppPage />} />
      <Route path="/cust" element={<CustPage />} />

    </Routes>
  )
};

export default App;
