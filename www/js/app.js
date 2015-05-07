$(document).ready(function() {

    var formatNumber = function(n) {
        var n = parseFloat('' + n);
        if (isNaN(n) || !isFinite(n)) return '0,00';
        var n = n.toFixed(2) + '';
        var x = n.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    forceResizeEvent = function() {
        var resizer = function() {
            if (window.fireEvent) {
                window.fireEvent('resize');
            } else
            if (window.dispatchEvent && window.Event) {
                window.dispatchEvent(new Event('resize'));
            } else
            if (window.resize && ($.type(window.resize) == 'function')) {
                window.resize();
            } else {
                $(window).resize();
            }
        }
        setTimeout(resizer, 10);
    }

    var storage = {
        set: function(data, varName) {
            storage.data[varName] = data;
        },
        get: function(varName) {
            return storage.data[varName];
        },
        data: {}
    }

    $(".filter-type").click(function(event) {

        filterShipperList($(this).attr('id'), this);

    });

    $('.js-tablesort').stupidtable().on("beforetablesort", function (event, data) {
        $(this).find('.js-icon')
            .removeClass('glyphicon-triangle-top')
            .removeClass('glyphicon-triangle-bottom');
        var icon = $(this).find('th').eq(data.column).find('.js-icon');
        if (data.direction == 'asc') {
            icon.addClass('glyphicon-triangle-bottom');
        } else
        if (data.direction == 'desc') {
            icon.addClass('glyphicon-triangle-top');
        }
    });

    //
    //
    //
    // Generates time period
    //
    //
    //

    $('.date-filter input').pickmeup({
        position: 'bottom',
        format: 'Y-m-d',
        hide_on_select: true,
        change: function() {
            $(this).change();
        }
    });
    $('.date-filter input').on('change', function(event){
        var input = $(this);
        input.parent().find('span').text(input.val());

        var from = $('#date-filter-from').val();
        var to = $('#date-filter-to').val();

        if (from >= to) {
            alert("Not valid");
            return;
        } else {
            storage.set([from, to], 'dateArray');
            getBaseData(storage.get('dateArray'));
            getTopExportingCompanies(storage.get('dateArray'));
            getTopExportingSpecies(storage.get('dateArray'));
            getTopExportingDestinations(storage.get('dateArray'));
        }
    });

    (function(){
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT MIN(SUBSTRING(departure_date FROM 1 FOR 10)) AS min, MAX(SUBSTRING(departure_date FROM 1 FOR 10)) AS max FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7"', function(data) {
            var range = data.result.records[0];
            var inputFrom = $('#date-filter-from');
            var inputTo = $('#date-filter-to');

            inputFrom.val(range.min);
            inputTo.val(range.max);

            inputFrom.parent().find('span').text(inputFrom.val());
            inputTo.parent().find('span').text(inputTo.val());

            // Force data update
            inputTo.change();
        });
    })();

    //
    //
    //
    // Get base map data
    //
    //
    //


    function getBaseData(dateArray) {
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country","lat","lon",sum("weight_rwe"),"shipper_description","shipper_type","species" FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\' GROUP BY "destination_country","lat","lon","shipper_description","shipper_type","species"', function(data) {
            // Data raw
            storage.set(data.result.records, 'baseData');
            initData(data.result.records);
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
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper",sum("weight_rwe") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\' GROUP BY "shipper" ORDER BY sum("weight_rwe") DESC', function(data) {
            $("#topExportingCompanies .js-icon")
                .removeClass('glyphicon-triangle-top')
                .removeClass('glyphicon-triangle-bottom');
            $("#topExportingCompanies tbody").empty();
            $("#topExportingCompanies .dateLabel").html(" from <span>" + dateArray[0] + "</span> to <span>" + dateArray[1] + "</span>");
            $.fn.matchHeight._update();
            storage.set(data.result.records, 'topExportingCompanies');
            _.each(data.result.records, function(item) {
                $("#topExportingCompanies tbody").append('<tr><td>' + item.shipper + ' </td><td class="text-right"> ' + formatNumber(item.sum) + ' tonnes</td></tr>');
            });

        });
    }


    //
    //
    //
    // getTopExportingDestinations
    //
    //
    //

    function getTopExportingDestinations(dateArray) {
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",sum("weight_rwe") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\' GROUP BY "destination_country" ORDER BY sum("weight_rwe") DESC', function(data) {
            $("#topExportingDestinations .js-icon")
                .removeClass('glyphicon-triangle-top')
                .removeClass('glyphicon-triangle-bottom');
            $("#topExportingDestinations tbody").empty();
            $("#topExportingDestinations .dateLabel").html(" from <span class='text-red'>" + dateArray[0] + "</span> to <span class='text-red'>" + dateArray[1] + "</span>");
            $.fn.matchHeight._update();
            storage.set(data.result.records, 'topExportingDestinations');

            _.each(data.result.records, function(item) {
                $("#topExportingDestinations tbody").append('<tr><td>' + item.destination_country + ' </td><td class="text-right"> ' + formatNumber(item.sum) + ' tonnes</td></tr>');
            });
        });
    }


    //
    //
    //
    // Get exported species when dropdown was changed, will change when select route.
    //
    //
    //


    function getTopExportingSpecies(dateArray) {
        $("#speciesTableHeading").html('Species exported');
        $.fn.matchHeight._update();
        $.get('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_rwe") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  GROUP BY "species" ORDER BY sum("weight_rwe") DESC', function(data) {
            $("#speciesExported .js-icon")
                .removeClass('glyphicon-triangle-top')
                .removeClass('glyphicon-triangle-bottom');
            $("#speciesExported tbody").empty();
            $("#speciesExported .dateLabel").html("from <span class='text-red'>" + dateArray[0] + "</span> to <span class='text-red'>" + dateArray[1] + "</span>");
            $.fn.matchHeight._update();
            storage.set(data.result.records, 'topExportingSpecies');
            _.each(data.result.records, function(item) {
                $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td><td class="text-right"> ' + formatNumber(item.sum) + ' tonnes</td></tr>');
            });

        });
    }


    //
    //
    //
    // General init funtion
    //
    //
    //

    function initData(data) {
        var dataLocations = [];
        var dataDestirnations = [];

        // Fold values in data array
        var collected = {};
        _.each(data, function(item){
            if (this.hasOwnProperty(item.destination_country)) {
                this[item.destination_country].sum += item.sum;
            } else {
                this[item.destination_country] = item;
            }
        }, collected);
        var DRCData = _.values(collected);

        // Route and markers quantity loop ( 20 is ok )
        // Max. 30 routes
        var n = DRCData.length > 31 ? 31 : DRCData.length;
        for (var i = 1; i < n; i++) {
            if (DRCData[i].destination_country != DRCData[i - 1].destination_country) {
                // Markers
                dataLocations.push(generateLocation(DRCData[i]));
                // Routes
                dataDestirnations.push(generateDestirnation(DRCData[i]));
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
            dataDestirnationObj.weight = '000000'; // Hack for the map marker size on Congo, based on a number
            dataDestirnationObj.color = '#000';
        } else {
            var markerDestirnation = new google.maps.LatLng(data.lat, data.lon);
            dataDestirnationObj.location = markerDestirnation;
            dataDestirnationObj.country = data.destination_country;
            dataDestirnationObj.weight = data.sum;
            dataDestirnationObj.color = '#dd202c';
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

        var dataLocation = {};
        dataLocation.country = data.destination_country;
        dataLocation.weight = data.sum;
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
            // Shift map down because most markers are on the top of map
            center: new google.maps.LatLng(-3.693714 + 30, 23.991271),
            zoom: 3,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: window.mapStyles,

            mapTypeControl: false,
            streetViewControl: false
        };


        var map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);

        map.setOptions({
            scrollwheel: false
        });

        $('.map_container').off('click').off('mouseleave')
            .on('click', function(event){
                map.setOptions({
                    scrollwheel: true
                });
            })
            .on('mouseleave', function(event){
                map.setOptions({
                    scrollwheel: false
                });
            });

        var infowindow = new google.maps.InfoWindow({});

        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
        };

        var markers = []


        // Set infowindows
        function setInfoWindows(country) {
            $(".map-block").addClass('slider-visible');
            forceResizeEvent();

            var routeClicked = country;
            window.selectedCountry = country;
            _.each(storage.get('markers'), function(item) {
                if (item.title == routeClicked) {
                    setContent(routeClicked);
                    (function(map, item) {
                        setTimeout(function () {
                            infowindow.open(map, item);
                        }, 100);
                    })(map, item);
                };
            });

            var shippers = []

            _.each(storage.get('baseData'), function(item) {
                var shipperEach = {};

                if (item.destination_country == routeClicked) {
                    shipperEach.name = item.shipper;
                    shipperEach.type = item.shipper_type;
                    shipperEach.weight = item.weight_rwe;
                    shipperEach.description = item.shipper_description;
                    shippers.push(shipperEach);
                };


            });
            generateShipperList(country);
            $("#country").text(country);
        }


        function generateShipperList(country) {
            var dateArray = storage.get('dateArray');
            var URL = 'http://datahub.io/api/action/datastore_search_sql?sql=SELECT "shipper","destination_country","shipper_type",sum("weight_rwe"),"shipper_description" FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "shipper","destination_country","shipper_type","shipper_description" ORDER by sum("weight_rwe") DESC'
            $.get(URL, function(data) {
                data = data.result.records;
                storage.set(data, 'dataShippersCountry');
                storage.set(data, 'dataShippersCountry_bak');

                $("#countrySelected span").text(data[0].destination_country);
                initSlider();
            });


            var URL = 'http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",sum("weight_rwe") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "destination_country"'
            $.get(URL, function(data) {
                $("#countrySelectedAmount").text(formatNumber(data.result.records[0].sum) + " tonnes");
                $("#countrySelectedAmountInPopup").text(formatNumber(data.result.records[0].sum) + " tonnes");
            });
            var URL = 'http://datahub.io/api/action/datastore_search_sql?sql=SELECT "destination_country",count(DISTINCT "species") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + dateArray[0] + '\' AND \'' + dateArray[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "destination_country"'
            $.get(URL, function(data) {
                $("#speciesNumber").text(data.result.records[0].count);
            });



        }

   $('input[type=checkbox]').change(function() {
        var filterArray = []
        if ($('#concession').prop("checked")) {
            filterArray.push("concession");
        }
        if ($('#artisinal').prop("checked")) {
            filterArray.push("artisinal");
        }
        filterSlider(filterArray);
    });



    //
    //
    //
    // Init slider
    //
    //
    //


    function initSlider() {
        var markdown = new Showdown.converter();
        var slider = $("#slider");
        var data = storage.get("dataShippersCountry");
        slider.empty();
        for (var i = 0; i < data.length; i++) {
            slider.append('<div class="slider-item"><div class="weight pull-left text-nowrap">' +
                formatNumber(data[i].sum) + ' tonnes</div><div class="inner-content"><h3>' + data[i].shipper +
                '</h3><div class="slider-desc">' + markdown.makeHtml(data[i].shipper_description) + '</div>' +
                '<span class="js-expand text-center slider-desc-shadow"><i class="glyphicon glyphicon-chevron-down"></i></span>' +
                '</div></div>');
        };
    }

        $('#slider').on('click', '.js-expand', function(event) {
            $(this).parent().find('.slider-desc').toggleClass('expanded');
            $(this).find('.glyphicon').toggleClass('glyphicon-chevron-down').toggleClass('glyphicon-chevron-up');
        });


        
    //
    //
    //
    // FilterSlider
    //
    //
    //



    function filterSlider(filterArray) {
        if (filterArray.length != 0) {
            var data = storage.get("dataShippersCountry_bak");
            var data_new = _.filter(data, function(shipper) {
                return shipper.shipper_type.toLowerCase() == filterArray[0] || shipper.shipper_type.toLowerCase() == filterArray[1]
            });
            storage.set(data_new, "dataShippersCountry");
        } else {
            storage.set(storage.get('dataShippersCountry_bak'), "dataShippersCountry");
        }
        initSlider();
    }

        //
        //
        //
        // Sets content for info windows
        //
        //
        //


        function setContent(country) {
                        var totalWeight = 0;
            var species = [];

            _.each(storage.get('baseData'), function(countryEach) {
                if (countryEach.destination_country == country) {
                    totalWeight += parseFloat(countryEach.sum)
                    $("#amountTotalTooltip").text('Total amount of shipped timber : ' + parseInt(totalWeight) + ' tonnes ');
                    var specieObjTemp = {};
                    specieObjTemp.specie = countryEach.species;
                    specieObjTemp.weight = countryEach.sum;
                    species.push(specieObjTemp);
                };
            });


            var uniqueSpecies = _.indexBy(species, "weight");

            species = [];

            _.each(uniqueSpecies, function(item, key) {
                if (item.specie === 'Unspecified') {
                    return;
                };
                species.push(item.specie);
            });


            var uniqueSpecies = _.uniq(species);

            var species = _.map(uniqueSpecies, function(item, index) {
                var item = item.toLowerCase();
                if (index == 0) {
                    item = item.charAt(0).toUpperCase() + item.slice(1);
                }
                return '<span>' + item + '</span>';
            });

            var contentString =
                '<div id="content">' +
                '<div id="siteNotice">' +
                '</div>' +
                '<h1 id="firstHeading" class="firstHeading"> ' + country + ' </h1>' +
                '<div id="bodyInfoWindowContent">' +
                '<h5 id="amountTotalTooltip"></h5>' +
                '<h5>Total (RWE): <span id="countrySelectedAmountInPopup"></span></h5>' +
                (species.length ? '<h5 class="hidden">Species: <span id="speciesTooltip">' + species.join(', ') + '</span></h5>' : '') +
                '</div>' +
                '</div>';

            infowindow.setContent(contentString);

            $("#speciesTableHeading").html('Species exported to <span>' + country + '</span>');
            $.fn.matchHeight._update();

            var URL = encodeURI('http://datahub.io/api/action/datastore_search_sql?sql=SELECT "species",sum("weight_rwe") FROM "7c936579-7940-42a3-ae79-a0f498cb7ea7" WHERE "departure_date" BETWEEN \'' + storage.get('dateArray')[0] + '\' AND \'' + storage.get('dateArray')[1] + '\'  AND "destination_country" = \'' + country + '\' GROUP BY "species" ORDER BY sum("weight_rwe") DESC');
            $.get(URL, function(data) {
                $("#speciesExported .js-icon")
                    .removeClass('glyphicon-triangle-top')
                    .removeClass('glyphicon-triangle-bottom');
                $("#speciesExported tbody").empty();
                storage.set(data.result.records, 'topExportingSpecies');
                _.each(data.result.records, function(item) {
                    $("#speciesExported tbody").append('<tr><td>' + item.species + ' </td><td class="text-right"> ' + formatNumber(item.sum) + ' tonnes</td></tr>');
                });
            });

        }


        $('.js-close-slider').on('click', function(event){
            $(".map-block").removeClass('slider-visible');
            var lastItem = storage.get("lastMarker");

            if (lastItem) {
                lastItem.setIcon('img/yellow/' + storage.get(lastItem.title) + '.png');
            };
            storage.set(null, "lastMarker");
            infowindow.close();
            forceResizeEvent();
        });


        //
        //
        //
        // Generates markers
        //
        //
        //

        var maxWeight = 0;
        _.each(dataDestirnations, function(item) {
            if (item.weight > maxWeight) {
                maxWeight = item.weight;
            }
        });

        _.each(dataDestirnations, function(item) {
            var markerSize = Math.round(Math.pow(item.weight / maxWeight, 1/Math.PI) * 4) + 1;
            storage.set(markerSize, item.country);
            if (item.country == "Democratic republic of Congo") {
                icon = {
                    path: 'M 0, 0 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0',
                    fillColor: item.color,
                    fillOpacity: 1,
                    scale: 0.2
                };
            } else {
                icon = 'img/yellow/' + markerSize + '.png';
            }
            var marker = new google.maps.Marker({
                position: item.location,
                map: map,
                // icon: ,
                icon: icon,
                title: item.country
            });

            markers.push(marker);
            item.$$marker = marker;

            storage.set(markers, 'markers');

            google.maps.event.addListener(marker, 'click', function() {
                var lastItem = storage.get("lastMarker");

                if (lastItem) {
                    lastItem.setIcon('img/yellow/' + storage.get(lastItem.title) + '.png');
                };

                storage.set(this, "lastMarker");
                this.setIcon('img/red/' + storage.get(this.title) + '.png');
                setInfoWindows(this.title);

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
                window.currentCity = this.country;

                var lastItem = storage.get("lastMarker");
                if (lastItem) {
                    lastItem.setIcon('img/yellow/' + storage.get(lastItem.title) + '.png');
                };
                var marker = null;
                _.find(dataDestirnations, function($$item) {
                    if ($$item.$$marker && ($$item.country == item.country)) {
                        marker = $$item.$$marker;
                        marker.setIcon('img/red/' + storage.get(marker.title) + '.png');
                        return true;
                    }
                });
                storage.set(marker, "lastMarker");

                setInfoWindows(this.country);
            });
        });



    }




});