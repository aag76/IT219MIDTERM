import React from 'react'
import './styles/App.css'
import LineGraph from './components/LineGraph';
function App3() {
  return (
    <div className="app">
  <LineGraph csvFile="/ufc_data.csv" />
  </div>
  )
}

export default App3;
