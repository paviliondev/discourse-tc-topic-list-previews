import { ajax } from 'discourse/lib/ajax';
import { withPluginApi } from 'discourse/lib/plugin-api';
import PreloadStore from "discourse/lib/preload-store";
import CategoryList from "discourse/models/category-list";
import TopicList from "discourse/models/topic-list";
import {findOrResetCachedTopicList} from 'discourse/lib/cached-topic-list';
import { hash } from "rsvp";
import EmberObject from "@ember/object";
import Site from "discourse/models/site";

const PLUGIN_ID = "topic-list-previews-tc";

export default {
  name: 'preview-route-edits',
  initialize(container){

    const site = container.lookup("service:site");

    let discoveryTopicRoutes = [];
    let discoveryCategoryRoutes = [
      'Category',
      'CategoryNone'
    ];
    let filters = site.get('filters');

    const topIndex = filters.indexOf('top');
    if (topIndex > -1) {
      filters.splice(topIndex, 1);
    }

    filters.forEach(filter => {
      const filterCapitalized = filter.charAt(0).toUpperCase() + filter.slice(1);
      discoveryTopicRoutes.push(filterCapitalized);
      discoveryCategoryRoutes.push(...[
        `${filterCapitalized}Category`,
        `${filterCapitalized}CategoryNone`
      ]);
    });

    discoveryTopicRoutes.forEach(function(route){
      var route = container.lookup(`route:discovery.${route}`);
      route.reopen({
        model(data, transition) {
          return this._super(data, transition).then((result) => {
            if (settings.topic_list_featured_images) {
              let featuredTopics = null;
              let filter = `tag/${settings.topic_list_featured_images_tag}`;
              let lastTopicList = findOrResetCachedTopicList (this.session, filter);
              this.store.findFiltered ('topicList', {filter}).then (list => {
                this.setProperties ({
                  featuredTopics: Ember.Object.create (list),
                });
                this.controllerFor('discovery').set('featuredTopics', this.featuredTopics);
              });
            }
            return result;
          })
        }
      });
    });

    discoveryCategoryRoutes.forEach(function(route){
      var route = container.lookup(`route:discovery.${route}`);
      route.reopen({
        afterModel(model, transition) {
          return this._super(model, transition).then((result) => {
            if (settings.topic_list_featured_images_category) {
              let featuredTopics = null;
              let filter = `tag/${settings.topic_list_featured_images_tag}`;
              let lastTopicList = findOrResetCachedTopicList (this.session, filter);
              this.store.findFiltered ('topicList', {filter}).then (list => {
                this.setProperties ({
                  featuredTopics: Ember.Object.create (list),
                });

                this.controllerFor('discovery').set('featuredTopics', this.featuredTopics);
              });
            }
            return result;
          })
        }
      });
    });

    withPluginApi('0.8.12', api => {
      api.modifyClass(`route:discovery-categories`, {
        pluginId: PLUGIN_ID,

        setFeaturedTopics() {
          let sortOrder = settings.topic_list_featured_images_created_order ? "created" : "activity";

          let filterObject = {
            filter: "latest",
            params: {
              tags: [`${settings.topic_list_featured_images_tag}`],
              order: sortOrder,
            },
          }

          this.store.findFiltered ("topicList", filterObject).then (list => {
            this.setProperties ({
              featuredTopics: EmberObject.create (list),
            });

            this.controllerFor('discovery').set('featuredTopics', this.featuredTopics);
          })
        },

        // unfortunately we have to override this whole method to extract the featured topics
        _findCategoriesAndTopics(filter) {
          PreloadStore.reset();
          return hash({
            wrappedCategoriesList: PreloadStore.getAndRemove("categories_list"),
            topicsList: PreloadStore.getAndRemove(`topic_list_${filter}`)
          }).then((response) => {
            let { wrappedCategoriesList, topicsList } = response;
            let categoriesList =
              wrappedCategoriesList && wrappedCategoriesList.category_list;

            this.setFeaturedTopics();

            if (categoriesList && topicsList) {
              if (topicsList.topic_list && topicsList.topic_list.top_tags) {
                Site.currentProp("top_tags", topicsList.topic_list.top_tags);
              }

              return EmberObject.create({
                categories: CategoryList.categoriesFrom(
                  this.store,
                  wrappedCategoriesList
                ),
                topics: TopicList.topicsFrom(this.store, topicsList),
                can_create_category: categoriesList.can_create_category,
                can_create_topic: categoriesList.can_create_topic,
                loadBefore: this._loadBefore(store),
              });
            }
            // Otherwise, return the ajax result
            return ajax(`/categories_and_${filter}`).then(result => {
              if (result.topic_list && result.topic_list.top_tags) {
                Site.currentProp("top_tags", result.topic_list.top_tags);
              }

              return EmberObject.create({
                categories: CategoryList.categoriesFrom(this.store, result),
                topics: TopicList.topicsFrom(this.store, result),
                can_create_category: result.category_list.can_create_category,
                can_create_topic: result.category_list.can_create_topic,
                loadBefore: this._loadBefore(this.store),
              });
            });
          });
        }
      });
    });
  }
};
