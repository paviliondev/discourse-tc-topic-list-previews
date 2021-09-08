export default Ember.Mixin.create({

    _settingEnabled(setting) {
      debugger;

        const routeEnabled = this.get('routeEnabled');
        if (routeEnabled) {
          return routeEnabled.indexOf(setting) > -1;
        }

        const filter = this._filter();
        const discoveryList = this.get('discoveryList');
        const suggestedList = this.get('suggestedList');
        const currentRoute = this.get('currentRoute');

        if (!discoveryList && !suggestedList && !(currentRoute.indexOf('userActivity') > -1) && !(currentRoute.indexOf('tag') > -1)) return false;

        const category = this.get('category');
        const siteSetting = settings[setting] ? settings[setting].toString() : false;
        const filterArr = filter ? filter.split('/') : [];
        const filterType = filterArr[filterArr.length - 1];

        const catEnabled = category && ((setting == 'topic_list_thumbnails' && settings.topic_list_thumbnails_categories.includes(category.id)) ||
                            (setting == 'topic_list_excerpts' && settings.topic_list_excerpts_categories.includes(category.id)) ||
                            (setting == 'topic_list_tiles' && settings.topic_list_tiles_categories.includes(category.id)))

        const siteEnabled = siteSetting && siteSetting.split('|').indexOf(filterType) > -1;
        const siteDefaults = settings.topic_list_set_category_defaults;
        const isTopic = ['suggested', 'suggested-mobile'].includes(filterType);

        return isTopic ? siteEnabled : (category ? (catEnabled || siteDefaults && siteEnabled) : siteEnabled);
      },

      _filter() {

        let filter = this.get('parentView.model.filter');

        const currentRoute = this.get('currentRoute');
        if (currentRoute.indexOf('tag') > -1) filter = 'tags';
        if (currentRoute.indexOf('top') > -1) filter = 'top';
        if (currentRoute.indexOf('topic') > -1) filter = 'suggested';
        if (currentRoute == 'userActivity.portfolio') filter = 'activity-portfolio';
        if (currentRoute == 'userActivity.topics') filter = 'activity-topics';

        const mobile = this.get('site.mobileView');
        if (mobile) filter += '-mobile';

        return filter;
      }
})