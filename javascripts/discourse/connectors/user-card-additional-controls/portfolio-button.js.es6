export default {
  setupComponent(attrs, component) {
    component.set('portfolioEnabled', settings.topic_list_portfolio);
  }
}