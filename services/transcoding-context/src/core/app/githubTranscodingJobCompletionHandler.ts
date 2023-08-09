// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens to github workflow run
// event and calls application logic. We might also consider this with other handlers.

