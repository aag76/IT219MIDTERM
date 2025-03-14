import React from 'react'
import './styles/App.css'
import UFCChampionData from './components/UFCChampionData';
function App() {
  return (
    <div className="app">
  <UFCChampionData csvFile="/ufc_data.csv" />
  </div>
  )
}

export default App;
