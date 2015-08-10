$(".form-wrapper").click(function(){
	$(".form").removeClass("hidden");
});

$("#submit-location").click(function(){
  codeAddress($("#location").val());
});

$("#zoom-in").click(function(){
  App.Map.scaleOffset = App.Map.scaleOffset + .1;
  App.Map.load();
});

$("#zoom-out").click(function(){
  App.Map.scaleOffset = App.Map.scaleOffset - .1;
  App.Map.load();
});

$("#zoom-out").click(function(){
  codeAddress($("#location").val());
});

$("#expand-color-scheme").click(function(){
	$(".color-scheme").removeClass("hidden");
});

$(".style-selector").change(function(){
	$("#map").removeClass("light medium grayscale custom default-mapzen").addClass($(this).val());
	$('.ocean').attr('style', '');
	$('.water').attr('style', '');
	$('.riverbank').attr('style', '');
	$('.water-layer').attr('style', '');
	$('.river').attr('style', '');
	$('.highway').attr('style', '');
	$('.major_road').attr('style', '');
	$('.minor_road').attr('style', '');
	$('.park').attr('style', '');
	$('.nature_reserve').attr('style', '');
	$('.wood').attr('style', '');
	$('.protected-land').attr('style', '');
});

$(".ocean-select").change(function(){
	$(".ocean").css("fill", $(this).val());
	$(".ocean").css("stroke", $(this).val());
	$(".water").css("fill", $(this).val());
	$(".riverbank").css("fill", $(this).val());
	$(".water-layer").css("stroke", $(this).val());
	$(".river").css("stroke", $(this).val());
});

$(".highway-select").change(function(){
	$(".highway").css("stroke", $(this).val());
});

$(".major-rd-select").change(function(){
	$(".major_road").css("stroke", $(this).val());
});

$(".minor-rd-select").change(function(){
	$(".minor_road").css("stroke", $(this).val());
});

$(".park-select").change(function(){
	$(".park").css("fill", $(this).val());
	$(".nature_reserve").css("fill", $(this).val());
	$(".wood").css("fill", $(this).val());
	$(".protected-land").css("fill", $(this).val());
});

function codeAddress(city) {
	var geocoder = new google.maps.Geocoder();

    geocoder.geocode( { 'address': city}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var latlng = results[0].geometry.location;
        App.Map.coordinates[0] = latlng.K;
	  	App.Map.coordinates[1] = latlng.G;
	  	App.Map.load();
      } else {
        console.log('Geocode was not successful for the following reason: ' + status);
      }
    });
    
    //getIndex(noSpaceCity);
}


