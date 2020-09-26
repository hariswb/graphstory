import React, {useEffect,useState,useRef} from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3"

const drag = simulation => {
	function dragstarted(event) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}
	function dragged(event) {
		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}
	function dragended(event) {
		if (!event.active) simulation.alphaTarget(0);
		event.subject.fx = null;
		event.subject.fy = null;
	}
	return d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
}

const nodeColor=(category,highest,shortest_path_nodes)=> {
	const colorScheme = {
		"plot_summary": d3.schemeDark2[0],
		"community":(d)=>getColor(d,"interpolateTurbo"),
		"degree_centrality": (d)=>getColor(d,"interpolatePlasma"),
		"eigenvector_centrality": (d)=>getColor(d,"interpolateViridis"),
		"betweenness_centrality": (d)=>getColor(d,"interpolateCool"),
		"closeness_centrality": (d)=>getColor(d,"interpolateCividis"),
		"shortest_path":(d)=>shortest_path_nodes.includes(d.character)?
							d3.schemeCategory10[1]:d3.schemeCategory10[9],
		"spanning_tree":d3.schemeAccent[4],
	}

	function getColor(d,scheme){
		return d3.scaleSequential(d3[scheme])(d[category]/highest[category])
	}

	console.log(category)
	return colorScheme[category]

}

function Chart(props){
	const width = 500
	const height = 500
	const ref = useRef()
	const [focus,setFocus] = useState("")	
	const [init,setInit] = useState(0);

	useEffect(() => {

		if(init < 1 || props.category == "spanning_tree"){
			const edges = props.category == "spanning_tree"?props.spanning_tree:props.edges
			
			// console.log(edges)
			const svg = d3.select(ref.current)
		    			  .attr("viewBox", [0, 0, width, height])
		    const layer1 = svg.append('g');
			const layer2 = svg.append('g');
			const layer3 = svg.append('g');
			const rect = layer1
							.append("rect")
		    				.attr("x1", 0)
			        		.attr("y1", 0)
			        		.attr("width", width)
	      					.attr("height", height)
		    				.attr("fill","white")
		    				.on("click",function(){
		    					d3.select(this).text(d=> setFocus(""))})

		    

			const links = edges.map(d => Object.create({"source": d[0],"target":d[1],"value":1}))
	  		const nodes = props.nodes.map(d => Object.create(d));

		    const simulation = d3.forceSimulation(nodes)
	              .force("center", d3.forceCenter(width/2, height/2))  
	              .force("charge", d3.forceManyBody())
	              .force("link", d3.forceLink(links).id(d => d.character))
	              .force("radial",props.category=="spanning_tree"?d3.forceRadial(width/2):null)

	        const link = layer2
		      .attr("stroke", "#999")
		      .attr("stroke-opacity", 0.6)
		      .selectAll("line")
		      .data(links)
		      .join("line")
		      .attr("stroke-width", d => Math.sqrt(d.value));

		    const node = layer3
		      .attr("stroke", "#fff")
		      .attr("stroke-width", 1.5)
		      .selectAll("circle")
		      .data(nodes)
		      .join("circle")
		      .attr("r", 7)
		      .attr("fill", nodeColor(props.category,props.highest,props.shortest_path_nodes))
		      .call(drag(simulation))
		      .on("click",function(){ 
		      	d3.select(this).text(d=> setFocus(d.character))})
		      


	      	simulation.on("tick", () => {
			    link.attr("x1", d => d.source.x)
			        .attr("y1", d => d.source.y)
			        .attr("x2", d => d.target.x)
			        .attr("y2", d => d.target.y);
			    node.attr("cx", d => d.x)
			        .attr("cy", d => d.y);
			  });

	      	props.category=="spanning_tree"?setInit(0):setInit(1)
      	}else if(init > 0 && props.category){
      		d3.selectAll("circle")
      		  .attr("fill", nodeColor(props.category,props.highest,props.shortest_path_nodes))
      	}else if(init > 0 && props.category == "spanning_tree"){
      		setInit(0)
      	}

  	}, [props.category])

	useEffect(()=>{
		props.onChange(focus)
	},[focus])

	return(
			<div className="chart">
				<svg 
		      		ref={ref}
		      	/>
	      	</div>
	      	)
}

export default Chart;