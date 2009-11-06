// bug in IE when using replaceWith - duplicates content, lose event handlers
// this from http://dev.jquery.com/ticket/2697
$.fn.replaceWith = function(value) {
	return this.each(function() {
		var e = $(this);
		var s = e.next();
		var p = e.parent();
		e.remove();
		if (s.size())
			s.before(value);
		else
			p.append(value);
	});
}
DependentInputs = {
	rows: [],
	values: {},
	dependencies: [],
	decoyValue: "Please select...",
	rowClass: "advSearchLine",
	fieldClass: "advSearchLineField",
	valClass: "advSearchLineValue",
	addDependency: function(f) {
		this.dependencies.push(f);
	},
	makeSelect: function($container,values,attrs,addDecoy) {
		var $select = $("<select></select>");
		if(addDecoy) {
			$select.append($("<option>"+this.decoyValue+"</option>"));
		}
		for(var i=0; i<values.length; i++) {
			$select.append($("<option>"+values[i]+"</option>"));
		}
		if(addDecoy) {
			$select.append($("<option></option>"));
		}
		if(attrs) {
			$select.attr(attrs);
		}
		if($container) {
			$container.append($select);
		}
		return $select;
	},
	makeInput: function($container,attrs) {
		var $input = $('<input type="text" />').appendTo($container);
		if(attrs) {
			$input.attr(attrs);
		}
		return $input;
	},
	addChangeHandler: function($select,i) {
		var getChanged = function(event) {
			var $target = $(event.target);
			var changed;
			if($target.hasClass(DependentInputs.fieldClass)) {
				changed = "field";
			} else if ($target.hasClass(DependentInputs.valClass)) {
				changed = "value";
			} else {
				throw new Error("something changed other than field or value in row, index "+i+", class: "+$target.className);
			}
			DependentInputs.checkAll(i,changed);
		};
		$select.change(getChanged);
	},
	addRow: function(container,field,val,i) {
		i = i || 0;
		var $field = $(container).find(field).eq(i);
		var $val = $(container).find(val).eq(i);
		return this.convert($field,$val);
	},
	addRows: function(container,field,val,rowSelector) {
		var $fields = $(container).find(field);
		var $vals = $(container).find(val);
		var $rowShells;
		if(rowSelector) {
			$rowShells = $(container).find(rowSelector);
		}
		return this.convert($fields,$vals,$rowShells);
	},
	convert: function($fields,$vals,$rowShells) {
		if($fields.length!==$vals.length) {
			throw new Error("error when converting rows - fields and vals not the same length - fields: "+$fields.length+", vals: "+$vals.length);
		} else if($rowShells && $rowShells.length!==$vals.length) {
			throw new Error("error when converting rows - rowShells and row-pairs not the same length - rowShells: "+$rowShells.length+", row-pairs: "+$vals.length);
		}
		var $field, $val, $rowShell;
		var $row;
		var n;
		for(var i=0;i<$fields.length;i++) {
			$field = $($fields[i]);
			$val = $($vals[i]);
			if($rowShells) {
				$rowShell = $($rowShells[i]);
			}
			$row = $rowShell || $field.parent();
			$row.field = $field;
			$row.field.addClass(this.fieldClass);
			if(!$row.field.val() && $row.field.get(0).innerHTML) {
				// field is static, not an input
				$row.field.val($row.field.get(0).innerHTML);
			}
			$row.val = $val;
			$row.val.addClass(this.valClass);
			n = DependentInputs.rows.push($row)-1;
			this.addChangeHandler($row,n);
		}
		this.checkAll(n,"field");
		return n;
	},
	createRow: function(container) {
		var $container = $(container);
		var $row = $("<div></div>").appendTo($container);
		var i = this.rows.push($row)-1;
		$row.addClass(this.rowClass);
		$row.field = this.makeSelect($row,this.fields,{
			"name":"adv_"+i+"_field"
		});
		$row.field.addClass(this.fieldClass);
		$row.val = this.makeInput($row, {
			"name":"adv_"+i+"_value",
			"size":"35"
		});
		$row.val.addClass(this.valClass);
		$row.button = $("<button>-</button>").appendTo($row).click(function() {
			// have to figure out i again, as it might have changed
			var i = $('.'+DependentInputs.rowClass).index($(this).parent());
			DependentInputs.rows.splice(i,1);
			var name;
			$container.find('.'+DependentInputs.rowClass+':gt('+i+')').each(function(n) {
				$(this).find(':input:not(button)').each(function() {
					name = $(this).attr('name').replace(i+1+n,i+n);
					$(this).attr('name',name);
				});
			});
			$row.remove();
			DependentInputs.checkAll(0,"field");
		});
		this.addChangeHandler($row.field,i);
		this.checkAll(i,"field");
		return i;
	},
	setDecoy: function() {
		var oldSetDecoy = this.setDecoy;
		var cancelDecoys = function() {
			$(this).find('select').each(function(i) {
				if($(this).val()===DependentInputs.decoyValue) {
					$(this).val("");
				}
			});
		};
		var $row = this.rows[0];
		$row.closest('form').submit(cancelDecoys);
		this.setDecoy = function() {
			return false;
		};
		this.setDecoy.restore = function() {
			DependentInputs.setDecoy = oldSetDecoy;
			$row.closest('form').unbind('submit',cancelDecoys);
		};
	},
	replaceValues: function(i,values) {
		// JRL: note - should only create hidden drop-down if there is a $row.valueMap, otherwise it's not needed - the mechanism to update such a thing is currently in the added dependencies - might want to think about bringing that in
		var $row = this.rows[i];
		// prep the form for throwing away decoy values on submission
		this.setDecoy();
		$row.values = values;
		var className = $row.val.get(0).className;
		var inputName = $row.val.attr('name');
		var currVal = $row.val.val();
		var $hid = $('<input type="hidden" />');
		$hid.attr({
			"name":inputName
		});
		var $select = this.makeSelect(null,values,null,true);
		$row.val.replaceWith($select);
		$row.val = $select;
		this.addChangeHandler($row.val,i);
		$row.val.attr("name","_ignore_"+inputName);
		$row.val.after($hid);
		$row.val.get(0).className = className;
		if(currVal) {
			if($row.valueMap) {
				for(var i in $row.valueMap) {
					if($row.valueMap[i]===currVal) {
						currVal = i; // the map is a reverse map in this context
					}
				}
			}
			$row.val.val(currVal);
			$row.val.trigger("change");
		}
	},
	checkAll: function(i,changed) {
		// JRL: I am not convinced that checking the 'ith' row first makes any difference to the outcome, nor that this 'i' is updated when rows are removed - suggest removing this use of 'i'
		if(this.rows.length) {
			DependentInputs.checkRow(i,changed);
			for(var j=0;j<DependentInputs.rows.length;j++) {
				if(j!==i) {
					// all other lines are candidates for changing their values, so check their dependencies as if they'd just changed their field to its current value
					DependentInputs.checkRow(j,"field");
				}
			}
		}
	},
	checkRow: function(i,changed) {
		var $row = this.rows[i];
		var matched = false;
		var values;
		for(var d=0; d<this.dependencies.length; d++) {
			values = this.dependencies[d]($row,changed);
			if(values) {
				matched = true;
				if($row.values!==values) {
					this.replaceValues(i,values);
					if($row.button) {
						$row.button.appendTo($row);
					}
				}
				//break;
			}
		}
		// if there are no dependencies matched and we're a drop-down, it's time to change back to an input
		if(!matched && $row.values && changed==="field") {
			delete $row.values;
			delete $row.valuesMap;
			var $hid = $row.find('input:hidden').remove();
			var className = $row.val.get(0).className;
			var $inp = this.makeInput(null, {
				name: $hid.attr('name'),
				"size":"35"
			});
			$row.val.replaceWith($inp);
			$row.val = $inp;
			$row.val.addClass(className);
			if($row.button) {
				$row.button.appendTo($row);
			}
		}
	}
};

DependentInputs.values.countries = (function() {
	var countries = [];
	for(var i in ISO_3166.countries.name2iso) {
		countries.push(i);
	}
	return countries;
})();

DependentInputs.values.us_states = (function() {
	var states = [];
	for(var i in ISO_3166.usa.name2iso) {
		states.push(i);
	}
	return states;
})();

DependentInputs.values.aus_states = (function() {
	var states = [];
	for(var i in ISO_3166["2:AU"].name2iso) {
		states.push(i);
	}
	return states;
})();

DependentInputs.values.ca_states = (function() {
	var states = [];
	for(var i in ISO_3166["2:CA"].name2iso) {
		states.push(i);
	}
	return states;
})();

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Operational Country") {
		$row.valueMap = ISO_3166.countries.name2iso;
		return DependentInputs.values.countries;
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Registered Country") {
		$row.valueMap = ISO_3166.countries.name2iso;
		return DependentInputs.values.countries;
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Operational State") {
		var $r;
		for(var i=0;i<DependentInputs.rows.length;i++) {
			$r = DependentInputs.rows[i];
			if($r.field.val()==="Operational Country" && $r.val.val()==="United States") {
				$row.valueMap = ISO_3166.usa.name2iso;
				return DependentInputs.values.us_states;
			}
		}
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Registered State") {
		var $r;
		for(var i=0;i<DependentInputs.rows.length;i++) {
			$r = DependentInputs.rows[i];
			if($r.field.val()==="Registered Country" && $r.val.val()==="United States") {
				$row.valueMap = ISO_3166.usa.name2iso;
				return DependentInputs.values.us_states;
			}
		}
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Operational State") {
		var $r;
		for(var i=0;i<DependentInputs.rows.length;i++) {
			$r = DependentInputs.rows[i];
			if($r.field.val()==="Operational Country" && $r.val.val()==="Australia") {
				$row.valueMap = ISO_3166["2:AU"].name2iso;
				return DependentInputs.values.aus_states;
			}
		}
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Registered State") {
		var $r;
		for(var i=0;i<DependentInputs.rows.length;i++) {
			$r = DependentInputs.rows[i];
			if($r.field.val()==="Registered Country" && $r.val.val()==="Australia") {
				$row.valueMap = ISO_3166["2:AU"].name2iso;
				return DependentInputs.values.aus_states;
			}
		}
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Operational State") {
		var $r;
		for(var i=0;i<DependentInputs.rows.length;i++) {
			$r = DependentInputs.rows[i];
			if($r.field.val()==="Operational Country" && $r.val.val()==="Canada") {
				$row.valueMap = ISO_3166["2:CA"].name2iso;
				return DependentInputs.values.ca_states;
			}
		}
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="field" && $row.field.val()==="Registered State") {
		var $r;
		for(var i=0;i<DependentInputs.rows.length;i++) {
			$r = DependentInputs.rows[i];
			if($r.field.val()==="Registered Country" && $r.val.val()==="Canada") {
				$row.valueMap = ISO_3166["2:CA"].name2iso;
				return DependentInputs.values.ca_states;
			}
		}
	}
});

DependentInputs.addDependency(function($row,changed) {
	if(changed==="value") {
		var inpVal = $row.val.val();
		var mappedVal = $row.valueMap[inpVal] || "";
		$row.find('input:hidden').eq(0).val(mappedVal);
	}
});

DependentInputs.fields = [
	'Legal Name',
	'Previous Name_s_',
	'Trades As Name_s_',
	'Trading Status',
	'Company Website',
	'Registered Country',
	'Operational PO Box',
	'Operational Floor',
	'Operational Building',
	'Operational Street 1',
	'Operational Street 2',
	'Operational Street 3',
	'Operational City',
	'Operational State',
	'Operational Country',
	'Operational Postcode'
];