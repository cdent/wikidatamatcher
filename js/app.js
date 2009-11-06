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
	var queryVars = {};
	var $container;
	var noResults = function() {
		$container = $('#noMatch');
		$container.find('a').click(function() {
			$('#searchExplanation').show();
		});
		$container.show();
	};
	var processJSON = function(records) {
		if(records.length===0) {
			if(noResults) {
				/* construct a different set of queries, go get the data
					for(var i in queryVars) {
						// make a query
						// aggregate the results
						// make them unique
						// pass them back into processJSON
					}
				 if there are still no results say so */
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
		$('#results > div').hide();
		var url = "http://wiki-data.com/search.json?";
		var str = "";
		$form.find(':input:not(:submit)').each(function() {
			queryVars[$(this).attr('name')] = $(this).val();
		});
		for(var i in queryVars) {
			str += "&"+i+"="+queryVars[i];
		}
		str = str.substring(1);
		url += str+"&jsonp_callback=?";
		$.getJSON(url, processJSON);
		return false;
	});
	$('#search a').click(function() {
		addAdvSearchLine();
	});
});