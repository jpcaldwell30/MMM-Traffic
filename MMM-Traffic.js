/* global Module */

/* Magic Mirror
 * Module: MMM-Traffic
 *
 * By Sam Lewis https://github.com/SamLewis0602
 * MIT Licensed.
 */

Module.register('MMM-Traffic', {

    defaults: {
        api_key: '',
        mode: 'driving',
        interval: 300000, //all modules use milliseconds
        origin: '',
        destination: '',
        traffic_model: 'best_guess',
        departure_time: 'now',
        loadingText: 'Loading commute...',
        prependText: 'Current commute is',
        changeColor: false,
        showGreen: true,
        language: config.language
    },

    start: function() {
        Log.info('Starting module: ' + this.name);
        Log.info(this.data.classes);
        if (this.data.classes === 'MMM-Traffic') {
          this.data.classes = 'bright medium';
        }
        this.loaded = false;
        this.url = 'https://maps.googleapis.com/maps/api/directions/json' + this.getParams();
        this.symbols = {
            'driving': 'fa fa-car',
            'walking': 'fa fa-odnoklassniki',
            'bicycling': 'fa fa-bicycle',
            'transit': 'fa fa-train'
        };
        this.commute = '';
        this.updateCommute(this);
    },

    updateCommute: function(self) {
        self.sendSocketNotification('TRAFFIC_URL', self.url);
        setTimeout(self.updateCommute, self.config.interval, self);
    },

    getStyles: function() {
        return ['traffic.css'];
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        if (!this.loaded) {
            wrapper.innerHTML = this.config.loadingText;
            return wrapper;
        }

        //symbol
        var symbol = document.createElement('span');
        symbol.className = this.symbols[this.config.mode] + ' symbol';
        if (this.config.changeColor) {
          if (this.trafficComparison >= 1.5) {
            symbol.className += ' red';
          } else if (this.trafficComparison >= 1.2) {
            symbol.className += ' yellow';
          } else if (this.config.showGreen) {
            symbol.className += ' green';
          }
        }
        wrapper.appendChild(symbol);

        //commute time
        var trafficInfo = document.createElement('span');
        trafficInfo.className = 'trafficInfo';
        trafficInfo.innerHTML = this.config.prependText + ' ' + this.commute;
        if (this.config.changeColor) {
          if (this.trafficComparison >= 1.5) {
            trafficInfo.className += ' red';
          } else if (this.trafficComparison >= 1.2) {
            trafficInfo.className += ' yellow';
          } else if (this.config.showGreen) {
            trafficInfo.className += ' green';
          }
        }
        wrapper.appendChild(trafficInfo);

        //routeName
        if (this.config.route_name) {
          var routeName = document.createElement('div');
          routeName.className = 'dimmed small routeName';
          routeName.innerHTML = this.config.route_name;
          wrapper.appendChild(routeName);
        }

        return wrapper;
    },

    getParams: function() {
        var params = '?';
        params += 'mode=' + this.config.mode;
        params += '&origin=' + this.config.origin;
        params += '&destination=' + this.config.destination;
        params += '&key=' + this.config.api_key;
        params += '&traffic_model=' + this.config.traffic_model;
        params += '&departure_time=now';
        params += '&language=' + this.config.language;
        return params;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'TRAFFIC_COMMUTE' && payload.url === this.url) {
            Log.info('received TRAFFIC_COMMUTE');
            this.commute = payload.commute;
            this.trafficComparison = parseInt(payload.trafficComparison);
            this.loaded = true;
            this.updateDom(1000);
        }
    }

});
