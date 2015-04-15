$(document).ready(function() {

    getBaseData(1, 1, 2011, 2011)
    getTopExportingCompanies(1, 1, 2011, 2011)
    getTopExportingSpecies(1, 1, 2011, 2014)
    getTopExportingDestirnations(1, 1, 2011, 2014)

    // Change filters event
    $("select").change(function() {
        var fromQuarter = $("#filterfromQuarter").val()
        var toQuarter = $("#filtertoQuarter").val()
        var fromYear = $("#filterFromYear").val()
        var toYear = $("#filterToYear").val()

        initData(window.DRCData, fromQuarter, toQuarter)

        if (parseInt(fromQuarter) > parseInt(toQuarter) || parseInt(fromYear) > parseInt(toYear)) {
            $("#errFilter").fadeIn();
            return
        } else {
            $("#errFilter").fadeOut()
            getBaseData(toQuarter, fromQuarter, fromYear, toYear)
            getTopExportingCompanies(toQuarter, fromQuarter, fromYear, toYear)
            getTopExportingSpecies(toQuarter, fromQuarter, fromYear, toYear)
            getTopExportingDestirnations(toQuarter, fromQuarter, fromYear, toYear)
        }
    });


    function getBaseData(toQuarter, fromQuarter, fromYear, toYear) {
        $.get('//datahub.io/api/action/datastore_search_sql?sql=SELECT * FROM "5939b04d-761f-4a12-8878-25bb0719ddbc" WHERE year >= 2011 AND year <= 2014 AND quarter >= 1 AND quarter <= 2', function(data) {
            $(".result").html(data);
            // Data raw
            initData(data.result.records)

        });
    }


    function getTopExportingCompanies(toQuarter, fromQuarter, fromYear, toYear) {

        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper","destination_country","shipper_type","year","quarter",sum("weight_tonnes"),"shipper_description" FROM "5939b04d-761f-4a12-8878-25bb0719ddbc" WHERE year >= ' + fromYear + ' AND year <= ' + toYear + ' AND quarter >= ' + fromQuarter + ' AND quarter <= ' + toQuarter + ' GROUP BY "shipper","destination_country","year","quarter","shipper_type","shipper_description"', function(data) {
            $(".result").html(data);
            $("#topExportingCompanies").empty()
            _.each(data.result.records, function(item) {
                $("#topExportingCompanies").append('<tr><td>' + item.shipper + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
            });

        });
    }



    function getTopExportingDestirnations(toQuarter, fromQuarter, fromYear, toYear) {
        $.get('//datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",sum("weight_tonnes") FROM "5939b04d-761f-4a12-8878-25bb0719ddbc" WHERE year >= ' + fromYear + ' AND year <= ' + toYear + ' AND quarter >= ' + fromQuarter + ' AND quarter <= ' + toQuarter + ' GROUP BY "destination_country"', function(data) {
            $(".result").html(data);
            $("#topExportingDestirnations").empty()
            _.each(data.result.records, function(item) {

                $("#topExportingDestirnations").append('<tr><td>' + item.destination_country + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
            });

        });
    }


    // Get exported species when dropdown was changed, will change when select route.
    function getTopExportingSpecies(toQuarter, fromQuarter, fromYear, toYear) {

        $.get('//datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_tonnes") FROM "5939b04d-761f-4a12-8878-25bb0719ddbc" WHERE year >= ' + fromYear + ' AND year <= ' + toYear + ' AND quarter >= ' + fromQuarter + ' AND quarter <= ' + toQuarter + ' GROUP BY "species"', function(data) {
            $(".result").html(data);

            $("#speciesExported").empty()
            _.each(data.result.records, function(item) {
                $("#speciesExported").append('<tr><td>' + item.species + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
            });

        });
    }


    // Main initialization function
    function initData(data, from, to) {
        var DRCData = data;
        window.DRCData = DRCData
        var dataLocations = [];
        var dataDestirnations = []
            // Route and markers quantity loop ( 20 is ok )
        for (var i = 1; i <= 500; i++) {
            if (DRCData[i].destination_country != DRCData[i - 1].destination_country) {
                if (from && to) {

                    if (dataDestirnations.length == 30 && dataLocations.length == 30) {
                        break
                    }
                    // Markers
                    dataLocations.push(generateLocation(DRCData[i]))
                        // Routes
                    dataDestirnations.push(generateDestirnation(DRCData[i]));


                } else {
                    if (dataDestirnations.length == 50) {
                        break
                    };




                    // Markers
                    dataLocations.push(generateLocation(DRCData[i]))
                        // Routes
                    dataDestirnations.push(generateDestirnation(DRCData[i]));

                }

            };
        };

        dataDestirnations.push(generateDestirnation('default'));
        initializeMap(dataLocations, dataDestirnations);
    }

});




// Generate destirnation data for polyline generation

function generateDestirnation(data) {


    var dataDestirnationObj = {}

    if (data === 'default') {

        var markerDestirnation = new google.maps.LatLng(-3.693714, 23.991271);
        dataDestirnationObj.location = markerDestirnation;
        dataDestirnationObj.country = 'Democratic republic of Congo';
    } else {
        var markerDestirnation = new google.maps.LatLng(data.lat, data.lon);
        dataDestirnationObj.location = markerDestirnation;
        dataDestirnationObj.country = data.destination_country;
    }
    return dataDestirnationObj

}

// Generate location date

function generateLocation(data) {

    var dataLocation = {}
    dataLocation.country = data.destination_country
    dataLocation.location = [
        new google.maps.LatLng(-3.693714, 23.991271),
        new google.maps.LatLng(data.lat, data.lon)

    ]

    return dataLocation

}


// Map initialization


function initializeMap(dataLocations, dataDestirnations) {

    var mapOptions = {
        center: new google.maps.LatLng(-3.693714, 23.991271),
        zoom: 3,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: window.mapStyles

    };


    var map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);

    var infowindow = new google.maps.InfoWindow({});


    var lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
    };

    var markers = []

    // Route generation
    _.each(dataDestirnations, function(item) {

        var marker = new google.maps.Marker({
            position: item.location,
            map: map,
            title: item.country
        });
        markers.push(marker)

        window.markers = markers

        google.maps.event.addListener(marker, 'click', function() {
            setInfoWindows(this.title)

        });

    });

    // Set infowindows
    function setInfoWindows(country) {
        var routeClicked = country
        window.selectedCountry = country
        _.each(window.markers, function(item) {
            if (item.title == routeClicked) {
                setContent(routeClicked)
                infowindow.open(map, item);
            };
        });

        var shippers = []
        var i = 0
        _.each(window.DRCData, function(item) {
            var shipperEach = {}
            i++
            if (item.destination_country == routeClicked) {
                shipperEach.name = item.shipper
                shipperEach.type = item.shipper_type
                shipperEach.weight = item.weight_rwe
                shipperEach.description = item.shipper_description
                shippers.push(shipperEach)
            };

            if (i == window.DRCData.length) {
                generateShipperList()
            };
        });
        window.shippers = shippers
        generateShipperList()
        $("#country").text(country)
    }


    // Set content for infowindow
    function setContent(country) {
        var contentString =

            '<div id="content">' +
            '<div id="siteNotice">' +
            '</div>' +
            '<h1 id="firstHeading" class="firstHeading"> ' + country + ' </h1>' +
            '<div id="bodyInfoWindowContent">' +
            '<h5 id="amountTotalTooltip"></h5>' +
            '<h5>Species shipped :</h5>' +
            '<h5 id="speciesTooltip"></h5>' +
            '</div>' +
            '</div>';

        infowindow.setContent(contentString);
        var totalWeight = 0;
        var species = [];
        _.each(window.DRCData, function(countryEach) {
            if (countryEach.destination_country == country) {
                totalWeight = totalWeight + parseFloat(countryEach.weight_rwe)
                $("#amountTotalTooltip").text('Total amount of shipped timber : ' + parseInt(totalWeight) + ' tons ')
                species.push(countryEach.species)
            };
        });

        var uniqueSpecies = _.uniq(species);
        _.each(uniqueSpecies, function(item) {
            $("#speciesTooltip").append('<p>' + item + '</p>')
        });
    }


    // Markers generation
    _.each(dataLocations, function(item) {

        var route = new google.maps.Polyline({
            path: item.location,
            icons: [{
                icon: lineSymbol,
                offset: '100%'
            }],
            geodesic: true,
            strokeColor: '#272727',
            strokeOpacity: 1,
            strokeWeight: 4,
            country: item.country
        });

        route.setMap(map);




        google.maps.event.addListener(route, 'click', function() {
            document.title = "DRC Timber Dashboard - " + this.country + "route";
            setInfoWindows(this.country)
                // mymap represents the map you created using google.maps.Map
        });
    });


}




function generateShipperList(type, elem) {

    $('.custom-button').css({
        background: '#dddddd',
        color: '#252525'
    });
    $("#" + type).css({
        background: '#e00613',
        color: '#fff'
    });
    if (window.current === $(elem).attr('id')) {
        $('.custom-button').css({
            background: '#dddddd',
            color: '#252525'
        });
        type = undefined
        window.current = 'All'
    } else {
        window.current = $(elem).attr('id')
    }


    $(".scrollit").empty()
    $("#speciesExported").empty()
    var URL = encodeURI('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper","destination_country","shipper_type","year","quarter",sum("weight_tonnes"),"shipper_description" FROM "5939b04d-761f-4a12-8878-25bb0719ddbc" WHERE "destination_country" = \'' + window.selectedCountry + '\' AND year = 2011 AND quarter = 1 GROUP BY "shipper","destination_country","year","quarter","shipper_type","shipper_description"')

    $.get(URL, function(data) {
        $(".result").html(data);
        // Data raw
        var shippers = data.result.records


        _.each(shippers, function(shipper) {
            if (shipper.shipper_type.toLowerCase() != type && typeof type != 'undefined') {
                return
            }

            $("#speciesExported").append('<tr><td>' + shipper.shipper + ' </td> <td> ' + shipper.sum + ' Tons</td></tr>')
            $(".scrollit").append('<div class = "col-lg-11 col-centered shipper-data" ><h3> Company ' + shipper.shipper + ' </h3> <h5> <span class = "semibold">Volume</span> : ' + shipper.sum + ' Tons</h5> <h5> <span class = "semibold" > Description </span> : ' + shipper.shipper_description + '</h5></div> ');

        });
    });

}
