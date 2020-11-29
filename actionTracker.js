let _store

export default store => {
    _store = store
    store.state.__actionTracker_runningActions = new Map()
    store.state.__actionTracker_completedActions = new Set()
    Object.keys(store._actions).forEach(name => {
        const func = store._actions[name][0]
        store._actions[name][0] = payload => {
            const promise = func(payload).finally(() => {
                store.state.__actionTracker_runningActions.delete(name)
                store.state.__actionTracker_completedActions.add(name)
            })
            store.state.__actionTracker_runningActions.set(name, promise)
            return promise
        }
    })
}

export const isRunning = actionName => {
    return !!_store.state.__actionTracker_runningActions?.has(actionName)
}

export const isComplete = actionName => {
    return !!_store.state.__actionTracker_completedActions?.has(actionName)
}

export const doAfter = (actionName, func) => {
    return _store.state.__actionTracker_runningActions?.get(actionName)?.promise?.then(func)
}

export const getPromise = actionName => {
    return _store.state.__actionTracker_runningActions?.get(actionName)?.promise
}

export const waitOrDo = (actionName, func) => {
    const promise = _store.state.__actionTracker_runningActions?.get(actionName)?.promise
    if(promise) promise.then(func)
    else func()
}

export const runOnce = (actionName, payload) => {
    if(!_store.state.__actionTracker_completedActions?.has(actionName)) {
        return _store.dispatch(actionName, payload)
    }
}