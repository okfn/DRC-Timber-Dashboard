$(document).ready(function() {

    var storage = {
        set: function(data,varName) {
            storage.data[varName] = data
        },
        get: function(varName) {
            return storage.data[varName]
        },
        data : {}
    }

    storage.set(['2012-1-1', '2014-9-30'],'dateArray')

    getBaseData(storage.get('dateArray'))
    getTopExportingCompanies(storage.get('dateArray'))
    getTopExportingSpecies(storage.get('dateArray'))
    getTopExportingDestirnations(storage.get('dateArray'))


  $(".filter-type").click(function(event) {

    filterShipperList($(this).attr('id'),this)
  
  });

    $(".sortTable").click(function(event) {
        var filterObj = JSON.parse($(this).attr('data'))
        switch(filterObj.item) {
    case 'companies':
       getTopExportingCompanies(['filter', filterObj.filterBy])
        break;
    case 'destirnations':
       getTopExportingDestirnations(['filter', filterObj.filterBy])
        break;
    case 'species':
       getTopExportingSpecies(['filter', filterObj.filterBy])
        break;
}
    

    });


//
//
//
// Generates time period
//
//
//


    function getTimePeriod(fromQuarter, toQuarter, fromYear, toYear) {



        switch (parseInt(fromQuarter)) {
            case 1:
        var dayFrom = '-1-1'
        break;
            case 2:
        var dayFrom = '-4-1'
        break;
            case 3:
       var dayFrom = '-7-1'
        break;
            case 4:
        var dayFrom = '-10-1'
        break;
    
}



        var fromDate = fromYear + dayFrom


 switch (parseInt(toQuarter)) {
            case 1:
        var dayTo = '-3-31'
        break;
            case 2:
         var dayTo = '-6-30'
        break;
            case 3:
        var dayTo = '-9-30'
        break;
            case 4:
         var dayTo = '-112-31'
        break;
    
}


        var toDate = toYear + dayTo

        storage.set([fromDate, toDate],'dateArray')
        return [fromDate, toDate]
    }


//
//
//
// Filter select event
//
//
//


    $("select").change(function() {

        var fromQuarter = $("#filterfromQuarter").val()
        var toQuarter = $("#filtertoQuarter").val()
        var fromYear = $("#filterFromYear").val()
        var toYear = $("#filterToYear").val()

        if (parseInt(fromQuarter) >= parseInt(toQuarter) || parseInt(fromYear) >= parseInt(toYear)) {
       alert("Not valid")
            return
        } else {
   console.log(storage.get('dateArray'))
            storage.set(getTimePeriod(fromQuarter, toQuarter, fromYear, toYear),'dateArray')
            getBaseData(storage.get('dateArray'))
            getTopExportingCompanies(storage.get('dateArray'))
            getTopExportingSpecies(storage.get('dateArray'))
            getTopExportingDestirnations(storage.get('dateArray'))
        }
    });



//
//
//
// Get base map data
//
//
//
  

    function getBaseData(dateArray) {
        $.get('//datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country","lat","lon",sum("weight_tonnes"),"shipper_description","shipper_type","species" FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\' GROUP BY "destination_country","lat","lon","shipper_description","shipper_type","species"', function(data) {
            $(".result").html(data);
            // Data raw
            storage.set(data.result.records, 'baseData')    
            initData(data.result.records)

        });
    }


//
//
//
// getTopExportingCompanies
//
//
//


    function getTopExportingCompanies(dateArray) {
     
    if (dateArray[0] != 'filter') {
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\' GROUP BY "shipper" ORDER BY sum("weight_tonnes") DESC', function(data) {
            $("#topExportingCompanies tbody").empty()
            $("#topExportingCompanies .dateLabel").html(" from <span>" + dateArray[0] + "</span> to <span>" + dateArray[1] + "</span>")
            storage.set(data.result.records, 'topExportingCompanies')
            _.each(data.result.records, function(item) {
                $("#topExportingCompanies tbody").append('<tr><td>' + item.shipper + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
            });

        });
} else {
         var tempData = _.sortBy(storage.get('topExportingCompanies'), function(num) {
             return num[dateArray[1]]
         });
         $("#topExportingCompanies tbody").empty()
         _.each(tempData, function(item) {
             $("#topExportingCompanies tbody").append('<tr><td>' + item.shipper + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
         });
     }
    }


//
//
//
// getTopExportingDestirnations
//
//
//

    function getTopExportingDestirnations(dateArray) {
       
      if (dateArray[0] != 'filter') {
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\' GROUP BY "destination_country" ORDER BY sum("weight_tonnes") DESC', function(data) {
            $("#topExportingDestirnations tbody").empty()
            $("#topExportingDestirnations .dateLabel").html(" from <span class='text-red'>" + dateArray[0] + "</span> to <span class='text-red'>" + dateArray[1] + "</span>")
            storage.set(data.result.records, 'topExportingDestirnations')

            _.each(data.result.records, function(item) {

                $("#topExportingDestirnations tbody").append('<tr><td>' + item.destination_country + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
            });


        });
        
      } else {

         var tempData = _.sortBy(storage.get('topExportingDestirnations'), function(num) {

             return num[dateArray[1]]
         });



         $("#topExportingDestirnations tbody").empty()
         _.each(tempData, function(item) {

             $("#topExportingDestirnations tbody").append('<tr><td>' + item.destination_country + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
         });
     }
    }


//
//
//
// Get exported species when dropdown was changed, will change when select route.
//
//
//


    function getTopExportingSpecies(dateArray) {
        
if (dateArray[0] != 'filter') {
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  GROUP BY "species" ORDER BY sum("weight_tonnes") DESC', function(data) {

            $("#speciesExported tbody").empty()
            $("#speciesExported .dateLabel").html("from <span class='text-red'>" + dateArray[0] + "</span> to <span class='text-red'>" + dateArray[1] + "</span>")
            storage.set(data.result.records, 'topExportingSpecies')
            _.each(data.result.records, function(item) {
                $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
            });

        });
    }else{

         var tempData = _.sortBy(storage.get('topExportingSpecies'), function(num) {
     
             return num[dateArray[1]]
         });
         $("#speciesExported tbody").empty()
         _.each(tempData, function(item) {
             $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
         });
    }
    }


//
//
//
// General init funtion
//
//
//

    function initData(data, from, to) {
        var DRCData = data;
        var dataLocations = [];
        var dataDestirnations = []
            // Route and markers quantity loop ( 20 is ok )
        for (var i = 1; i <= 30; i++) {
            if (DRCData[i].destination_country != DRCData[i - 1].destination_country) {
                if (from && to) {

                    //Markers
                    dataLocations.push(generateLocation(DRCData[i]))
                        // Routes
                    dataDestirnations.push(generateDestirnation(DRCData[i]));
                } else {
                   
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


//
//
//
// Generates data for markers
//
//
//

function generateDestirnation(data) {


    var dataDestirnationObj = {}

    if (data == 'default') {
        var markerDestirnation = new google.maps.LatLng(-3.693714, 23.991271);
        dataDestirnationObj.location = markerDestirnation;
        dataDestirnationObj.country = 'Democratic republic of Congo';
        dataDestirnationObj.weight = '000000' // Hack for the map marker size on Congo, based on a number
        dataDestirnationObj.color = '#000'
    } else {
        var markerDestirnation = new google.maps.LatLng(data.lat, data.lon);
        dataDestirnationObj.location = markerDestirnation;
        dataDestirnationObj.country = data.destination_country;
        dataDestirnationObj.weight = data.sum
        dataDestirnationObj.color = '#dd202c'
    }
    return dataDestirnationObj

}

//
//
//
// Generates data for routes
//
//
//

function generateLocation(data) {

    var dataLocation = {}
    dataLocation.country = data.destination_country
    dataLocation.weight = data.sum
    dataLocation.location = [
        new google.maps.LatLng(-3.693714, 23.991271), // Republic of Congo
        new google.maps.LatLng(data.lat, data.lon)

    ]

    return dataLocation

}


//
//
//
// Initializes the map
//
//
//


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









    // Set infowindows
    function setInfoWindows(country) {
        var routeClicked = country
        window.selectedCountry = country
        _.each(storage.get('markers'), function(item) {
            if (item.title == routeClicked) {
                setContent(routeClicked)
                infowindow.open(map, item);
            };
        });

        var shippers = []
    
        _.each(storage.get('baseData') , function(item) {
            var shipperEach = {}
         
            if (item.destination_country == routeClicked) {
                shipperEach.name = item.shipper
                shipperEach.type = item.shipper_type
                shipperEach.weight = item.weight_rwe
                shipperEach.description = item.shipper_description
                shippers.push(shipperEach)
            };

         
        });
        generateShipperList()
        $("#country").text(country)
    }



//
//
//
// Sets content for info windows
//
//
//


    function setContent(country) {
        var contentString =

            '<div id="content">' +
            '<div id="siteNotice">' +
            '</div>' +
            '<h1 id="firstHeading" class="firstHeading"> ' + country + ' </h1>' +
            '<div id="bodyInfoWindowContent">' +
            '<h5 id="amountTotalTooltip"></h5>' +
            '<h5>Species shipped :</h5>' +
            '<div id="speciesTooltip"></div>' +
            '</div>' +
            '</div>';

        infowindow.setContent(contentString);
        var totalWeight = 0;
        var species = [];

        _.each(storage.get('baseData') , function(countryEach) {
            if (countryEach.destination_country == country) {
                totalWeight = totalWeight + parseFloat(countryEach.sum)
                $("#amountTotalTooltip").text('Total amount of shipped timber : ' + parseInt(totalWeight) + ' tons ')
                var specieObjTemp = {}
                specieObjTemp.specie = countryEach.species
                specieObjTemp.weight = countryEach.sum
                species.push(specieObjTemp)

            };
        });

        
        var uniqueSpecies = _.indexBy(species, "weight");

        species = []

        _.each(uniqueSpecies, function(item, key) {
            if (item.specie === 'Unknown') {
                return
            };
            species.push(item.specie)
        });


        uniqueSpecies = _.uniq(species)
    

        
    
    $("#speciesTooltip").append(_.map(uniqueSpecies, function(item, index) {
            var item = item.toLowerCase();
            if (index == 0) {
                item = item.charAt(0).toUpperCase() + item.slice(1);
            }
            return '<span>' + item + '</span>';
        }).join(', '));
    
        
    }


    //
//
//
// Generates markers
//
//
//

    _.each(dataDestirnations, function(item) {

       var markerSize = (item.weight.toString().length - 4.5)  / 10

        var marker = new google.maps.Marker({
            position: item.location,
            map: map,
            icon: {
                path: 'M 0, 0 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0',
                fillColor: item.color,
                fillOpacity: 1,
                scale: markerSize > 0.25 ? 0.25 : markerSize,
                strokeColor: '#dd202c',
            },
            title: item.country
        });

        markers.push(marker)

        storage.set(markers,'markers')

        google.maps.event.addListener(marker, 'click', function() {
        setInfoWindows(this.title)

        });

    });


//
//
//
// Generates routes
//
//
//
 var lineSymbol = {
    path: 'M 0,-1 0,3',
    strokeOpacity: 1,
    scale: 3
  };


    _.each(dataLocations, function(item) {



        var route = new google.maps.Polyline({
            geodesic: true,
            country: item.country,
            path: item.location,
    strokeOpacity: 0,
    icons: [{
      icon: lineSymbol,
      offset: '0',
      repeat: '30px'
    }],
    map: map
        });

        route.setMap(map);


        google.maps.event.addListener(route, 'click', function() {
            document.title = "DRC Timber Dashboard - " + this.country + "route";
            window.currentCity = this.country
            setInfoWindows(this.country)
                // mymap represents the map you created using google.maps.Map
        });
    });

   

}



//
//
//
// Filters right table with shippers
//
//
//


function filterShipperList(type, elem){

    $('.custom-button').css({
        background: '#dddddd',
        color: '#252525'
    });
    $("#" + type).css({
        background: '#e00613',
        color: '#fff'
    });
    if (storage.get('currentShipperType') == $(elem).attr('id')) {
        $('.custom-button').css({
            background: '#dddddd',
            color: '#252525'
        });
        type = undefined
        storage.set('All','currentShipperType')
    } else {
      storage.set($(elem).attr('id'),'currentShipperType')
    }
 $(".scrollit").empty()

 _.each(storage.get("ShipperList"), function(shipper) {
    if (shipper.shipper_type.toLowerCase() != type &&  storage.get('currentShipperType') != 'All') { return };

 $(".scrollit").append('<div class = "col-lg-11 col-centered shipper-data" ><h3> Company ' + shipper.shipper + ' </h3> <h5> <span class = "semibold">Volume</span> : ' + shipper.sum + ' Tons</h5> <h5> <span class = "semibold" > Description </span> : ' + shipper.shipper_description + '</h5></div> ');

}); 
}

//
//
//
// Generates right table with shippers
//
//
//


 function generateShipperList(type) {
    $(".scrollit").empty()
    $("#speciesExported tbody").empty()
    $("#speciesExported h4").text("Species exported to " + window.currentCity)
    var URL = encodeURI('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper","destination_country","shipper_type",sum("weight_tonnes"),"shipper_description" FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' +  storage.get('dateArray')[0] + '\' AND \'' + storage.get('dateArray')[1] + '\'  AND "destination_country" = \'' + window.selectedCountry + '\' GROUP BY "shipper","destination_country","shipper_type","shipper_description" ORDER by sum("weight_tonnes") DESC')
    $.get(URL, function(data) {
        // Data raw
        data.result.records = _.sortBy(data.result.records, function(num) { return num.sum})
        storage.set(data.result.records, "ShipperList")
        var shippers = data.result.records
        _.each(shippers, function(shipper) {
            $("#speciesExported tbody").append('<tr><td>' + shipper.shipper + ' </td> <td> ' + shipper.sum + ' Tons</td></tr>')
            $(".scrollit").append('<div class = "col-lg-11 col-centered shipper-data" ><h3> Company ' + shipper.shipper + ' </h3> <h5> <span class = "semibold">Volume</span> : ' + shipper.sum + ' Tons</h5> <h5> <span class = "semibold" > Description </span> : ' + shipper.shipper_description + '</h5></div> ');

        });
    });
    var URL = encodeURI('//datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' +  storage.get('dateArray')[0] + '\' AND \'' + storage.get('dateArray')[1] + '\'  AND "destination_country" = \'' + window.selectedCountry + '\' GROUP BY "species" ORDER BY sum("weight_tonnes") DESC')
    $.get(URL, function(data) {
       storage.set(data.result.records, 'topExportingSpecies')
        _.each(data.result.records, function(item) {
            $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
        });
    });

}




});

