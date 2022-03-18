import React from 'react';
import './App.css';
import Main from './components/main.component';
import { BrowserRouter, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Route path="/" component={Main}/>
      </div>
    </BrowserRouter>
  );
}

export default App;
