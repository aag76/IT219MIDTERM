import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const championsList = [
  "Mark Coleman", "Maurice Smith", "Randy Couture", "Bas Rutten",
  "Kevin Randleman", "Josh Barnett", "Ricco Rodriguez", "Tim Sylvia",
  "Frank Mir", "Andrei Arlovski", "Antônio Rodrigo Nogueira", "Brock Lesnar",
  "Shane Carwin", "Cain Velasquez", "Junior dos Santos", "Stipe Miocic",
  "Daniel Cormier", "Francis Ngannou", "Jon Jones"
];

const LineGraph = ({ csvFile }) => {
  const svgRef = useRef(null);
  const [data, setData] = useState([]);
  const [selectedChampion, setSelectedChampion] = useState(championsList[0]);

  useEffect(() => {
    d3.csv(csvFile).then((loadedData) => {
      setData(loadedData);  
    });
  }, [csvFile]);

  useEffect(() => {
    if (data.length === 0) return;

    const championData = data.filter(
      (row) =>
        row['Fighter 1'] === selectedChampion || row['Fighter 2'] === selectedChampion
    );

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(championData, (d) => d['Round'])])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(championData, (d) => Math.max(d['Fighter_1_STR'], d['Fighter_2_STR'], d['Fighter_1_TD'], d['Fighter_2_TD']))])
      .range([height, 0]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .call(d3.axisLeft(y));

    const lineStrikesFighter1 = d3.line()
      .x((d) => x(d['Round']))
      .y((d) => y(d['Fighter_1_STR']));

    const lineStrikesFighter2 = d3.line()
      .x((d) => x(d['Round']))
      .y((d) => y(d['Fighter_2_STR']));

    const lineTakedownsFighter1 = d3.line()
      .x((d) => x(d['Round']))
      .y((d) => y(d['Fighter_1_TD']));

    const lineTakedownsFighter2 = d3.line()
      .x((d) => x(d['Round']))
      .y((d) => y(d['Fighter_2_TD']));

    g.append('path')
      .data([championData])
      .attr('class', 'line')
      .attr('d', lineStrikesFighter1)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2);

    g.append('path')
      .data([championData])
      .attr('class', 'line')
      .attr('d', lineStrikesFighter2)
      .attr('fill', 'none')
      .attr('stroke', 'orange')
      .attr('stroke-width', 2);

    g.append('path')
      .data([championData])
      .attr('class', 'line')
      .attr('d', lineTakedownsFighter1)
      .attr('fill', 'none')
      .attr('stroke', 'green')
      .attr('stroke-width', 2);

    g.append('path')
      .data([championData])
      .attr('class', 'line')
      .attr('d', lineTakedownsFighter2)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 2);

  }, [data, selectedChampion]); // Re-render whenever data or selectedChampion changes

  return (
    <div>
      <h3>Select a Champion</h3>
      <select
        value={selectedChampion}
        onChange={(e) => setSelectedChampion(e.target.value)}
      >
        {championsList.map((champion, index) => (
          <option key={index} value={champion}>
            {champion}
          </option>
        ))}
      </select>

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default LineGraph;
