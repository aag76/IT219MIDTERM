import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const UFCFighterStats = ({ csvFile }) => {
  const [fightersData, setFightersData] = useState([]);

  useEffect(() => {
    d3.csv(csvFile).then((data) => {
      const fighterStats = {};

      data.forEach((fight) => {
        const fighter = fight["Fighter 1"]; 
        const fightYear = new Date(fight.Date).getFullYear(); 

        if (!fighterStats[fighter]) {
          fighterStats[fighter] = {
            Name: fighter,
            Total_Wins: 0,
            Total_Strikes_Thrown: 0,
            Total_Takedowns_Attempted: 0,
            Total_Submissions_Attempted: 0,
            Fights: 0,
            FirstYear: fightYear,
            LastYear: fightYear,
          };
        } else {
          fighterStats[fighter].FirstYear = Math.min(fighterStats[fighter].FirstYear, fightYear);
          fighterStats[fighter].LastYear = Math.max(fighterStats[fighter].LastYear, fightYear);
        }

        fighterStats[fighter].Total_Strikes_Thrown += +fight["Fighter_1_STR"] || 0;
        fighterStats[fighter].Total_Takedowns_Attempted += +fight["Fighter_1_TD"] || 0;
        fighterStats[fighter].Total_Submissions_Attempted += +fight["Fighter_1_SUB"] || 0;
        fighterStats[fighter].Fights += 1;

        if (fight.Winner === fighter) {
          fighterStats[fighter].Total_Wins += 1;
        }
      });

    
      const processedStats = Object.values(fighterStats).map((fighter) => ({
        Name: fighter.Name,
        Total_Wins: fighter.Total_Wins, 
        Avg_Strikes_Thrown: fighter.Fights > 0 ? fighter.Total_Strikes_Thrown / fighter.Fights : 0,
        Avg_Takedowns_Attempted: fighter.Fights > 0 ? fighter.Total_Takedowns_Attempted / fighter.Fights : 0,
        Avg_Submissions_Attempted: fighter.Fights > 0 ? fighter.Total_Submissions_Attempted / fighter.Fights : 0,
        ActiveYears: `${fighter.FirstYear}-${fighter.LastYear}`,
      }));

      setFightersData(processedStats);
    });
  }, [csvFile]);

  return (
    <div>
      <h2>UFC Fighter 1 Radar Chart (Averages)</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {fightersData.map((fighter) => (
          <div key={fighter.Name} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <h3>{fighter.Name} ({fighter.ActiveYears})</h3>
            <FighterRadarChart fighterData={fighter} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FighterRadarChart = ({ fighterData }) => {
  const chartRef = useRef();

  useEffect(() => {
    if (!fighterData) return;

    const width = 400;
    const height = 400; 
    const radius = Math.min(width, height) / 2 - 40; 

    const stats = [
      { axis: 'Strikes', value: fighterData.Avg_Strikes_Thrown },
      { axis: 'Takedowns', value: fighterData.Avg_Takedowns_Attempted },
      { axis: 'Submissions', value: fighterData.Avg_Submissions_Attempted },
    ];

    const maxStat = Math.max(
      fighterData.Avg_Strikes_Thrown,
      fighterData.Avg_Takedowns_Attempted,
      fighterData.Avg_Submissions_Attempted
    );

    const angleSlice = (2 * Math.PI) / stats.length;
    const radiusScale = d3.scaleLinear().domain([0, maxStat]).range([0, radius]);

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`); 

    for (let i = 1; i <= 5; i++) {
      g.append('circle')
        .attr('r', (radius / 5) * i)
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);
    }

    stats.forEach((d, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(angle))
        .attr('y2', radius * Math.sin(angle))
        .attr('stroke', '#000')
        .attr('stroke-width', 1);
      
      g.append('text')
        .attr('x', (radius + 20) * Math.cos(angle))
        .attr('y', (radius + 20) * Math.sin(angle))
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px') 
        .attr('fill', '#000')
        .text(d.axis);
    });

    const radarLine = d3.lineRadial()
    .radius(d => radiusScale(d.value))
    .angle((d, i) => i * angleSlice) 
    .curve(d3.curveLinearClosed);
  
  g.append('path')
    .datum(stats)
    .attr('d', radarLine)
    .attr('fill', 'rgba(0, 0, 255, 0.3)')
    .attr('stroke', '#00f')
    .attr('stroke-width', 2);
  
    g.selectAll('.data-point')
      .data(stats)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => radiusScale(d.value) * Math.cos(i * angleSlice - Math.PI / 2))
      .attr('cy', (d, i) => radiusScale(d.value) * Math.sin(i * angleSlice - Math.PI / 2))
      .attr('r', 5) 
      .attr('fill', '#00f')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
  }, [fighterData]);

  return <svg ref={chartRef}></svg>;
};

export default UFCFighterStats;
