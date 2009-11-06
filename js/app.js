function addAdvSearchLine() {
	var container = '#advancedSearchContainer';
	
	var i = DependentInputs.createRow(container);
	var $row = DependentInputs.rows[i];

	// reveal if not shown
	var $container = $(container);
	if($container.css('display')==="none") {
		$container.slideDown(250);
	}
	return $row;
}
$(document).ready(function() {
	var url = "http://wiki-data.com/search.json?";
	var queryVars = {
		count:0,
		vars:{}
	};
	var $container;
	var noResults = function() {
		$container = $('#noMatch');
		$container.find('a').click(function() {
			$('#searchExplanation').show();
		});
		$container.show();
	};
	var secondRound;
	var mergeUnique = function(to,from,by) {
		var match;
		for(var i=0;i<from.length;i++) {
			match = false;
			for(var j=0;j<to.length;j++) {
				if(to[j][by]===from[i][by]) {
					match = true;
					break;
				}
			}
			if(!match) {
				to[i] = from[i];
			}
		}
	};
	var processJSON = function(records) {
		if(records.length===0) {
			if(!secondRound) {
				secondRound = true;
				var count = 0;
				var secondRoundRecords = [];
				// get an ordered list of queryVars to make sequential queries on
				var vars = [];
				for(var i in queryVars) {
					vars.push(i);
				}
				var v;
				var str = "";
				var secondRoundCallback = function(records) {
					count++;
					mergeUnique(secondRoundRecords,records,"title");
					if(count<vars.length) {
						v = vars[count];
						str = v+"="+queryVars[v]+"&jsonp_callback=?";
						$.getJSON(url+str,secondRoundCallback);
					} else {
						processJSON(secondRoundRecords);
					}
				};
				v = vars[0];
				str = v+"="+queryVars[v]+"&jsonp_callback=?";
				$.getJSON(url, secondRoundCallback);
			} else {
				$('noMatches').show();
			}
		} else if(records.length===1) {
			var title = records[0].title;
			$container = $('#exactMatch');
			$container.find('a').attr({
				href: "http://wiki-data.com/bags/avox/tiddlers/"+title+".html",
				target: "_blank"
			}).text(title);
		} else {
			$container = $('#manyMatches');
			var address = function(fields) {
				var adr = "";
				var adrFields = [
					"operational_po_box",
					"operational_floor",
					"operational_building",
					"operational_street_1",
					"operational_street_2",
					"operational_street_3",
					"operational_city",
					"operational_state",
					"operational_city",
					"operational_country",
					"operational_postcode"
				];
				var field;
				for(var i=0;i<adrFields.length;i++) {
					field = fields[adrFields[i]];
					if(field) {
						adr += field + ", ";
					}
				}
				return adr;
			};
			var percentMatch = function(record) {
				var perc = 0;
				var maxMatches = 0;
				var matches = 0;
				var field, val;
				var nameFields = [
					"legal_name",
					"trades_as_name_s_",
					"previous_name_s_"
				];
				val = queryVars.q.toLowerCase();
				var nameField;
				var fields = record.fields;
				for(var i=0;i<nameFields.length;i++) {
					nameField = nameFields[i];
					if(fields[nameField].toLowerCase().indexOf(val)!==-1) {
						matches++;
						break;
					}
				}
				maxMatches++;
				for(var i in queryVars) {
					if(i.match(/adv_\d{1,2}_field/)) {
						field = queryVars[i].toLowerCase().replace(/ |\(|\)/g,"_");
						val = queryVars[i.replace('_field', '_value')].toLowerCase();
						if(val && fields[field]) {
							if(fields[field].toLowerCase().indexOf(val)!==-1) {
								matches++;
							}
							maxMatches++;
						}
					}
				}
				perc = Math.floor((matches / maxMatches)*100);
				return perc+"%";
			};
			var rowify = function(record) {
				var fields = record.fields;
				var row = "<tr><td>"+record.title+"</td><td>"+fields.legal_name+"</td><td>"+address(fields)+"</td><td>"+percentMatch(record)+"</td></tr>";
				return row;
			};
			var $tbody = $('#matchesTableBody').html("");
			$(records).each(function() {
				$tbody.append($(rowify(this)));
			});
		}
		return $container.show();
	};
	var $form = $('form');
	$form.submit(function() {
		// reset any changes from a previous search
		secondRound = false;
		$('#results > div').hide();
		// carry on with this search
		var str = "";
		$form.find(':input:not(:submit)').each(function() {
			queryVars[$(this).attr('name')] = $(this).val();
		});
		for(var i in queryVars) {
			str += "&"+i+"="+queryVars[i];
		}
		str = str.substring(1);
		str += str+"&jsonp_callback=?";
		$.getJSON(url+str, processJSON);
		return false;
	});
	$('#search a').click(function() {
		addAdvSearchLine();
	});
});