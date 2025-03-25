import React from 'react'
import './styles/App.css'
import UFCHeatmap from './components/UFCHeatmap';
function App2() {
  return (
    <div className="app">
  <UFCHeatmap csvFile="/UFC_champions.csv" />
  </div>
  )
}

export default App2;
