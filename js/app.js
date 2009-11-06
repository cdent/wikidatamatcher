/* app.js */
// override search links to use ajax_search as soon as possible
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
	var processJSON = function(records) {
		var $container;
		if(records.length===0) {
			$container = $('#noMatch');
			$container.find('a').click(function() {
				$('#searchExplanation').show();
			});
		} else if(records.length===1) {
			var title = records[0].title;
			$container = $('#exactMatch');
			$container.find('a').attr({
				href: "http://wiki-data.com/bags/avox/tiddlers/"+title+".html",
				target: "_blank"
			}).text(title);
		} else {
			$container = $('#manyMatches');
			var $tbody = $('#matchesTableBody');
			var address = function(fields) {
				var adr = "";
				var adrFields = [
					"fields.operational_po_box",
					"fields.operational_floor",
					"fields.operational_building",
					"fields.operational_street_1",
					"fields.operational_street_2",
					"fields.operational_street_3",
					"fields.operational_city",
					"fields.operational_state",
					"fields.operational_city",
					"fields.operational_country",
					"fields.operational_postcode"
				];
				for(var i=0;i<adrFields.length;i++) {
					adr += fields[adrFields[i]];
				}
				return adr;
			};
			var percentMatch = function() {
				// JRL: need to do this function
				return "50%";
			};
			var rowify = function(record) {
				var fields = record.fields;
				"<td>"+fields.avid+"</td><td>"+fields.legal_name+"</td><td>"+address(fields)+"</td><td>"+percentMatch();
			};
			$(records).each(function() {
				""
			});
		}
		return $container.show();
	};
	// make the form use the JSONP API
	var $form = $('form');
	$form.submit(function() {
		$('#results div:visible').hide();
		var url = "http://wiki-data.com/search.json?";
		var str = "";
		$form.find(':input:not(:submit)').each(function() {
			str += "&"+$(this).attr('name')+"="+$(this).val();
		});
		str = str.substring(1);
		url += str+"&jsonp_callback=?";
		$.getJSON(url, processJSON);
		return false;
	});

	// set advanced search on a slider
	$('#search a').click(function() {
		addAdvSearchLine();
	});
});