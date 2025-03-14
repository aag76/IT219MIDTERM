import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

const UFCHeatmap = ({ csvFile }) => {
  const [championsData, setChampionsData] = useState([]);

  const championsList = [
    "Mark Coleman", "Maurice Smith", "Randy Couture", "Bas Rutten",
    "Kevin Randleman", "Josh Barnett", "Ricco Rodriguez", "Tim Sylvia",
    "Frank Mir", "Andrei Arlovski", "Antônio Rodrigo Nogueira", "Brock Lesnar",
    "Shane Carwin", "Cain Velasquez", "Junior dos Santos", "Stipe Miocic",
    "Daniel Cormier", "Francis Ngannou", "Jon Jones",
  ];

  useEffect(() => {
    const fetchCSV = async () => {
      const data = await d3.csv(csvFile);

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
    };

    fetchCSV();
  }, [csvFile]);

  useEffect(() => {
    if (championsData.length === 0) return;

    const svg = d3.select("#heatmap")
      .attr("width", 1200) // Set width
      .attr("height", 700);

    const metrics = ['Strikes', 'Takedowns', 'Submissions', 'Wins'];

    const heatmapData = championsData.flatMap(champion => metrics.map(metric => ({
      date: champion.Winner,
      metric,
      value: champion[`Total_${metric}_Thrown`] || champion[`Total_${metric}_Attempted`] || champion[`Total_Wins`] || 0
    })));

    const xScale = d3.scaleBand()
      .domain([...new Set(heatmapData.map(d => d.date))])
      .range([0, 1200])  
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(metrics)
      .range([0, 600])
      .padding(0.1);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(heatmapData, d => d.value)]);

    svg.selectAll("rect")
      .data(heatmapData)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.date))
      .attr("y", d => yScale(d.metric))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.value));

    svg.selectAll("text.value-label")
      .data(heatmapData)
      .enter()
      .append("text")
      .attr("x", d => xScale(d.date) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.metric) + yScale.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .text(d => d.value);

    const splitText = (name) => {
      const words = name.split(' ');
      return words.length > 1 ? [words[0], words.slice(1).join(' ')] : [name];
    };

    svg.selectAll("text.x-axis-label")
      .data([...new Set(heatmapData.map(d => d.date))])
      .enter()
      .append("text")
      .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
      .attr("y", 620)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => {
        const [firstLine, secondLine] = splitText(d);
        return `${firstLine}\n${secondLine}`; 
      })
      .attr("dy", "1.2em")  
      .style("white-space", "pre"); 

    svg.selectAll("text.y-axis-label")
      .data(metrics)
      .enter()
      .append("text")
      .attr("x", -100) 
      .attr("y", (d, i) => yScale(d) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .text(d => {
        const [firstLine, secondLine] = splitText(d); 
        return `${firstLine}\n${secondLine}`; 
      })
      .style("white-space", "pre") 
      .style("fill", "#000"); 

  }, [championsData]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">UFC Champion Performance Heatmap Visualization</h2>
      <svg id="heatmap"></svg>
    </div>
  );
};

export default UFCHeatmap;
