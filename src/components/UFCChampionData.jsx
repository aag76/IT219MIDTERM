import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const UFCChampionData = ({ csvFile }) => {
  const [championsData, setChampionsData] = useState([]);
  const [selectedChampion, setSelectedChampion] = useState(null);

  useEffect(() => {
    d3.csv(csvFile).then((data) => {
      const championsList = [
        "Mark Coleman", "Maurice Smith", "Randy Couture", "Bas Rutten",
        "Kevin Randleman", "Josh Barnett", "Ricco Rodriguez", "Tim Sylvia",
        "Frank Mir", "Andrei Arlovski", "Antônio Rodrigo Nogueira", "Brock Lesnar",
        "Shane Carwin", "Cain Velasquez", "Junior dos Santos", "Stipe Miocic",
        "Daniel Cormier", "Francis Ngannou", "Jon Jones",
      ];

      const championStats = {};

      data.forEach((fight) => {
        const winner = fight.Winner;
        const fighter1 = fight["Fighter 1"];
        const fighter2 = fight["Fighter 2"];

        if (championsList.includes(fighter1) || championsList.includes(fighter2)) {
          const fighters = [fighter1, fighter2];
          
          fighters.forEach((fighter) => {
            if (championsList.includes(fighter)) {
              if (!championStats[fighter]) {
                championStats[fighter] = {
                  Winner: fighter,
                  Total_Strikes_Thrown: 0,
                  Total_Takedowns_Attempted: 0,
                  Total_Submissions_Attempted: 0,
                  Total_Wins: 0,
                };
              }

              if (fighter === winner) {
                championStats[fighter].Total_Wins += 1;
              }

              const fighterPrefix = fighter === fighter1 ? "Fighter_1" : "Fighter_2";
              championStats[fighter].Total_Strikes_Thrown += +fight[`${fighterPrefix}_STR`] || 0;
              championStats[fighter].Total_Takedowns_Attempted += +fight[`${fighterPrefix}_TD`] || 0;
              championStats[fighter].Total_Submissions_Attempted += +fight[`${fighterPrefix}_SUB`] || 0;
            }
          });
        }
      });

      setChampionsData(Object.values(championStats));
    });
  }, [csvFile]);

  return (
    <div>
      <h2>UFC Champions Radar Chart Visualization</h2>
      
      <select onChange={(e) => setSelectedChampion(e.target.value)}>
        <option value="">Select a Champion</option>
        {championsData.map((champ) => (
          <option key={champ.Winner} value={champ.Winner}>
            {champ.Winner}
          </option>
        ))}
      </select>

      {/* Display wins by the dropdown */}
      {selectedChampion && (
        <div>
          <p><strong>Wins: </strong>{championsData.find((c) => c.Winner === selectedChampion).Total_Wins}</p>
        </div>
      )}

      {selectedChampion && (
        <ChampionRadarChart championData={championsData.find((c) => c.Winner === selectedChampion)} />
      )}
    </div>
  );
};

const ChampionRadarChart = ({ championData }) => {
  const chartRef = useRef();

  useEffect(() => {
    if (!championData) return;

    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const angleScale = d3.scaleBand()
      .domain(['Strikes', 'Takedowns', 'Submissions'])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, Math.max(championData.Total_Strikes_Thrown, championData.Total_Takedowns_Attempted, championData.Total_Submissions_Attempted, championData.Total_Wins)])
      .range([0, radius]);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const circleCount = 5;
    for (let i = 1; i <= circleCount; i++) {
      g.append('circle')
        .attr('r', (radius / circleCount) * i)
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);
    }

    g.selectAll('.axis')
      .data(angleScale.domain())
      .enter().append('line')
      .attr('class', 'axis')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d) => radiusScale(championData[`Total_${d}_Attempted`]+90) * Math.cos(angleScale(d) - Math.PI / 2))
      .attr('y2', (d) => radiusScale(championData[`Total_${d}_Attempted`]+90) * Math.sin(angleScale(d) - Math.PI / 2))
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    const line = d3.lineRadial()
      .radius(d => radiusScale(d.value))
      .angle((d, i) => angleScale(d.axis) + Math.PI / 2);

    const data = [
      { axis: 'Strikes', value: championData.Total_Strikes_Thrown },
      { axis: 'Takedowns', value: championData.Total_Takedowns_Attempted },
      { axis: 'Submissions', value: championData.Total_Submissions_Attempted },
    ];

    g.append('path')
      .datum(data)
      .attr('class', 'radar-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#00f')
      .attr('stroke-width', 2);

    g.selectAll('.axis-label')
      .data(angleScale.domain())
      .enter().append('text')
      .attr('class', 'axis-label')
      .attr('x', (d, i) => (radiusScale(championData[`Total_${d}_Attempted`]) + 100) * Math.cos(angleScale(d) - Math.PI / 2))
      .attr('y', (d, i) => (radiusScale(championData[`Total_${d}_Attempted`]) + 100) * Math.sin(angleScale(d) - Math.PI / 2))
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#000')
      .text(d => d);

  }, [championData]);

  return (
    <svg ref={chartRef}></svg>
  );
};

export default UFCChampionData;
