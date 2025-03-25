import React from 'react'
import './styles/App.css'
import UFCChampionData from './components/UFCChampionData';
import UFCFighterStats from './components/UFCChampionData';
function App() {
  return (
    <div className="app">
  <UFCFighterStats csvFile="/UFC_champions.csv" />
  </div>
  )
}

export default App;
