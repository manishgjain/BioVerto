/* Implementation of a graph visualizer

   

   API follows DS conventions.
*/

// create the dc object if it does not exist
if (typeof dc=='undefined')
    dc = {};

/* @param parent: the ID of the DOM element where the gauge will be hooked up into
   @param chartGroup: the group to which the gauge belongs to (determines when refreshing is done)
   */
dc.fgraph = function (parent){
    var _fgraph = {}, // main object
    _parentID = parent,     // keep track of the parent of an object
    _margins = {top:0, right: 0, bottom: 0, left: 0},
    _fCharge = -120, // charge parameter
    _nodeColor = d3.scale.category20(), // colors to be used for nodes
    _edgeColor = d3.scale.category20(), // colors to be used for edges
    _nodeColorAccessor = function(d){ return 1; }, // node color accessor
    _edgeColorAccessor = function(d){ return 1; }, // edge color accessor
    _edgeWidthAccessor = function(d){ return 2; },// controlls the width of the link
    _edgeWidthScale = d3.linear.scale().range([1,10]),
    _linkDistance = 30, // link distance for force
    _linkStrength,
    _force, // force layout
    _svg, // svg element
    _link, // links
    _node, // nodes
    _transitionDuration = 750,
    _graph = {}, // data to be displayed
    _width = 200,
    _height = 200,
    _displayNames = true, // should we display names
    _terminator; // not used, just to terminate list
    
    // we can initialize the links/nodes only when we have data
    function changeData(graph){
	if (!_svg)
	    _svg = d3.select(_parentID)
	    .append("svg");

	if (!_force)
	    _force = d3.layout.force()
	    .charge(_fCharge)
	    .linkDistance(_linkDistance);

	// wrap the info in graph so that force layout is happy
	var _nodeData = graph.nodes.map(function(d,i){
	    d.index = i;
	    return { data:d, weight: _weightAccessor(d) };
	});
	var _edgeData = graph.edges.map(function(d){
	    return {source: d.source.index, target:d.target.index, data: d.data};
	});

	_force
	    .nodes(_nodeData)
	    .links(_edgeData)
	    .start();

	_link = _svg.selectAll(".link")
	    .data(_edgeData)
	    .enter().append("line")
	    .attr("class", "link")
	    .style("stroke-width", function(d) { return _edgeWidthAccessor(d.data); });
	
	_node = _svg.selectAll(".node")
	    .data(graph.nodes)
	    .enter().append("g")
	    .attr("class", "node")
	    .call(_force.drag)
	    .on("mousedown", function(d) {
		d.fixed = true;
		d3.select(this).classed("sticky", true);
	    })
	    .on("dblclick", function(d) {
		d.fixed = false;
		d3.select(this).classed("sticky", false);
	    });

	_node.append("circle")
	    .attr("r", 5)
	    .style("fill", function(d) { return _nodeColors(_nodeColorAccessor(d.data)); })
	
	_node.append("title")
	    .text(function(d) { return d.name; });

	if (_displayNames)
	    _node.append("text")
	    .text(function(d) { return d.name; });
	
	_force.on("tick", function() {
	    _link.attr("x1", function(d) { return d.source.x; })
		    .attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
	    
	    _node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	});
    }


    _fgraph.doRender = function (){
        // delete old content if present
        // d3.select(_parentID).select("svg").remove();

	_fgraph.doRedraw();

	return _fgraph;
    }
    
    
    _fgraph.doRedraw = function (){
	var parent = $(_parentID); //$(_parentID+"-inner").parent();
        _width = parent.width()-_margins.left-_margins.right;
        _height = parent.height()-_margins.top-_margins.bottom;

	_svg
	    .attr("width", _width)
	    .attr("height", _height); 

	_force.size([_width, _height])
	    .start();
    }

    // should we display names for nodes?
    _fgraph.displayNames = function(_){
        if (!arguments.length) return _displayNames;
	_displayNames=_;

	if (_displayNames)
	    _node.append("text")
	    .text(function(d) { return d.name; });
	else {
	    _node.selectAll("text").remove();
	}

	// _fgraph.doRedraw();
        return _fgraph;
    }    

    // Change/get distance parametter of force
    _fgraph.distance = function(_){
        if (!arguments.length) return _linkDistance;
        _linkDistance=_;
	_force.linkDistance(_linkDistance).start();
        return _fgraph;
    }

    // Change/get strength parameter of force
    _fgraph.strength = function(_){
        if (!arguments.length) return _linkStrength;
        _linkStrength=_;
	_force.linkStrength(_linkStrength).start();
        return _fgraph;
    }

    // Change/get charge for graph
    _fgraph.charge = function(_){
        if (!arguments.length) return _fCharge;
        _fCharge=_;
	_force.charge(_fCharge).start();
        return _fgraph;
    }


    // Change/get inner colors
    _fgraph.nodeColors = function(_){
        if (!arguments.length) return _nodeColors;
        _nodeColors=_;
        return _fgraph;
    }

    _fgraph.edgeColors = function(_){
        if (!arguments.length) return _edgeColors;
        _edgeColors=_;
        return _fgraph;
    }
    
    _chart.nodeColorAccessor = function(_){
        if(!arguments.length) return _nodeColorAccessor;
        _nodeColorAccessor = _;
        return _chart;
    };

    _chart.edgeColorAccessor = function(_){
        if(!arguments.length) return _edgeColorAccessor;
        _edgeColorAccessor = _;
        return _chart;
    };

    _chart.weightAccessor = function(_){
        if(!arguments.length) return _weightAccessor;
	// TODO, enforce the changes
        _weightAccessor = _;
        return _chart;
    };

    // Change/get data
    _fgraph.graphView = function(_){
        if (!arguments.length) return _graph;
        _graph=_;
	changeData(_graph);
        return _fgraph;
    };

    _fgraph.resize = function(width, height){
	_width = width;
	_height = height;
	if (_force) _force.size([width, height]).start();
	if (_svg) 
	    _svg.attr("width", width)
	    .attr("height", height);
	return _fgraph;
    };

    _fgraph.minEdgeWidth = function(_){
	var range = _edgeWidthScale.range();
        if (!arguments.length)  return range[0];
	
	range[0] = _;
	_edgeWidthScale.range(range);

        return _fgraph;
    };

    _fgraph.maxEdgeWidth = function(_){
	var range = _edgeWidthScale.range();
        if (!arguments.length)  return range[1];
	
	range[1] = _;
	_edgeWidthScale.range(range);

        return _fgraph;
    };

    
    
    return _fgraph;


}
