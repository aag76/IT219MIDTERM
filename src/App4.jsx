import React from 'react'
import './styles/App.css'
import UFCPerformanceGraph from './components/UFCPerformanceGraph';

function App4() {
  return (
    <div className="app">
  <UFCPerformanceGraph csvFile="/ufc_data.csv" />
  </div>
  )
}

export default App4;
