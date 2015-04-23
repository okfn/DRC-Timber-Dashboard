$(document).ready(function() {

    var storage = {
        set: function(data, varName) {
            storage.data[varName] = data
        },
        get: function(varName) {
            return storage.data[varName]
        },
        data: {}
    }

    storage.set(0, 'lastSliderIndex')

    storage.set(['2012-1-1', '2014-9-30'], 'dateArray')

    getBaseData(storage.get('dateArray'))
    getTopExportingCompanies(storage.get('dateArray'))
    getTopExportingSpecies(storage.get('dateArray'))
    getTopExportingDestirnations(storage.get('dateArray'))


    $(".filter-type").click(function(event) {

        filterShipperList($(this).attr('id'), this)

    });

    $(".sortTable").click(function(event) {
        var filterObj = JSON.parse($(this).attr('data'))
        switch (filterObj.item) {
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

        storage.set([fromDate, toDate], 'dateArray')
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
            storage.set(getTimePeriod(fromQuarter, toQuarter, fromYear, toYear), 'dateArray')
            getBaseData(storage.get('dateArray'))
            getTopExportingCompanies(storage.get('dateArray'))
            getTopExportingSpecies(storage.get('dateArray'))
            getTopExportingDestirnations(storage.get('dateArray'))
        }
    });



    $('input[type=checkbox]').change(function() {
        var filterArray = []
        if ($('#concession').prop("checked")) {
            filterArray.push("concession")
        }
        if ($('#artisinal').prop("checked")) {
            filterArray.push("artisinal")
        }
        console.log(filterArray)
        filterSlider(filterArray)
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
            $("#speciesTableHeading").text('Species exported')
            $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  GROUP BY "species" ORDER BY sum("weight_tonnes") DESC', function(data) {

                $("#speciesExported tbody").empty()
                $("#speciesExported .dateLabel").html("from <span class='text-red'>" + dateArray[0] + "</span> to <span class='text-red'>" + dateArray[1] + "</span>")
                storage.set(data.result.records, 'topExportingSpecies')
                _.each(data.result.records, function(item) {
                    $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
                });

            });
        } else {

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

            _.each(storage.get('baseData'), function(item) {
                var shipperEach = {}

                if (item.destination_country == routeClicked) {
                    shipperEach.name = item.shipper
                    shipperEach.type = item.shipper_type
                    shipperEach.weight = item.weight_rwe
                    shipperEach.description = item.shipper_description
                    shippers.push(shipperEach)
                };


            });
            generateShipperList(country)
            $("#country").text(country)
        }


        function generateShipperList(country) {
            $(".shippers-slider").fadeIn()
            var dateArray = storage.get('dateArray')
            var URL = 'http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper","destination_country","shipper_type",sum("weight_tonnes"),"shipper_description" FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "shipper","destination_country","shipper_type","shipper_description" ORDER by sum("weight_tonnes") DESC'
            $.get(URL, function(data) {
                data = data.result.records
                storage.set(data, 'dataShippersCountry')
                storage.set(data, 'dataShippersCountry_bak')

                $("#countrySelected").text(data[0].destination_country)
                    // $("#countrySelectedAmount")
                initSlider()
            });


            var URL = 'http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "destination_country"'
            $.get(URL, function(data) {
                $("#countrySelectedAmount").text(data.result.records[0].sum + " tons")
                    // $("#countrySelectedAmount")
            });
            var URL = 'http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",count(DISTINCT "species") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "destination_country"'
            $.get(URL, function(data) {
                $("#speciesNumber").text(data.result.records[0].count)
                    // $("#countrySelectedAmount")
            });



        }


        $("#prevSlide").click(function(event) {
            prevSlide()
        });

        $("#nextSlide").click(function(event) {
            nextSlide()
        });

//
    //
    //
    // Init slider
    //
    //
    //


    function initSlider() {
        var data = storage.get("dataShippersCountry")
        $("#slider").empty()
        for (var i = 0; i <= 2; i++) {
            $("#slider").append('<div class="col-lg-4 col-each"><div class="weight col-lg-6 col-sm-12">' + data[i].sum + ' tons</div><div class="inner-content"><h3>' + data[i].shipper + '</h3><p class="slider-desc">Description : ' + data[i].shipper_description + ' </p></div></div>')
        };
    }

        
    //
    //
    //
    // FilterSlider
    //
    //
    //



    function filterSlider(filterArray) {
        if (filterArray.length != 0) {
            var data = storage.get("dataShippersCountry_bak")
            var data_new = _.filter(data, function(shipper) {
                return shipper.shipper_type.toLowerCase() == filterArray[0] || shipper.shipper_type.toLowerCase() == filterArray[1]
            });
            storage.set(data_new, "dataShippersCountry")
        } else {
            storage.set(storage.get('dataShippersCountry_bak'), "dataShippersCountry")
        }
        initSlider()
    }

    


        function nextSlide() {
            var lastIndex = storage.get('lastSliderIndex') + 3
            var dataShippers = storage.get('dataShippersCountry')
            if (lastIndex + 3 >= dataShippers.length) {
                $("#nextSlide").css('display', 'none');
            }
            if (lastIndex >= 3) {
                $("#prevSlide").css('display', 'block');
            }
            $("#slider").empty()
            for (var i = lastIndex - 2; i <= lastIndex; i++) {
                storage.set(i, 'lastSliderIndex')
                $("#slider").append('<div class="col-lg-4 col-each"><div class="weight col-lg-6 col-sm-12">' + dataShippers[i].sum + ' tons</div><div class="inner-content"><h3>' + dataShippers[i].shipper + '</h3><p class="slider-desc">Description : ' + dataShippers[i].shipper_description + ' </p></div></div>')
            };
            console.log(storage.get('lastSliderIndex'))
        }



        function prevSlide() {
            var lastIndex = storage.get('lastSliderIndex')
            var dataShippers = storage.get('dataShippersCountry')
            if (lastIndex <= dataShippers.length - 3) {
                $("#nextSlide").css('display', 'block');
            }
            if (lastIndex - 3 <= 0) {
                $("#prevSlide").css('display', 'none');
            }
            $("#slider").empty()
            for (var i = lastIndex - 1; i >= lastIndex - 3; --i) {
                storage.set(i, 'lastSliderIndex')
                $("#slider").append('<div class="col-lg-4 col-each"><div class="weight col-lg-6 col-sm-12">' + dataShippers[i].sum + ' tons</div><div class="inner-content"><h3>' + dataShippers[i].shipper + '</h3><p class="slider-desc">Description : ' + dataShippers[i].shipper_description + ' </p></div></div>')
            };
            console.log(storage.get('lastSliderIndex'))
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

            _.each(storage.get('baseData'), function(countryEach) {
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

            $("#speciesTableHeading").text('Species exported to ' + country)

            var URL = encodeURI('//datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_tonnes") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + storage.get('dateArray')[0] + '\' AND \'' + storage.get('dateArray')[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "species" ORDER BY sum("weight_tonnes") DESC')
            $.get(URL, function(data) {
                $("#speciesExported tbody").empty()
                storage.set(data.result.records, 'topExportingSpecies')
                _.each(data.result.records, function(item) {
                    $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td> <td> ' + item.sum + ' Tons</td></tr>')
                });
            });


        }


        //
        //
        //
        // Generates markers
        //
        //
        //

        _.each(dataDestirnations, function(item) {

            var markerSize = item.weight.toString().length - 3
            if (markerSize > 5) {
                markerSize = 5
            };
            storage.set(markerSize, item.country)
            if (item.country == "Democratic republic of Congo") {
                icon = {
                    path: 'M 0, 0 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0',
                    fillColor: item.color,
                    fillOpacity: 1,
                    scale: 0.2
                }
            } else {
                icon = 'img/yellow/' + markerSize + '.png'
            }
            var marker = new google.maps.Marker({
                position: item.location,
                map: map,
                // icon: ,
                icon: icon,
                title: item.country
            });

            markers.push(marker)

            storage.set(markers, 'markers')

            google.maps.event.addListener(marker, 'click', function() {
                var lastItem = storage.get("lastMarker")

                if (lastItem) {
                    lastItem.setIcon('img/yellow/' + storage.get(lastItem.title) + '.png');
                };

                storage.set(this, "lastMarker")
                this.setIcon('img/red/' + storage.get(this.title) + '.png');
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
            });
        });



    }




});