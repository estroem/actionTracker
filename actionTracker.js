let _store

export default store => {
    _store = store
    store.state._runningActions = new Map()
    store.state._completedActions = new Set()
    Object.keys(store._actions).forEach(name => {
        const func = store._actions[name][0]
        store._actions[name][0] = payload => {
            const promise = func(payload).finally(() => {
                store.state._runningActions.delete(name)
                store.state._completedActions.add(name)
            })
            store.state._runningActions.set(name, promise)
            return promise
        }
    })
}

export const isRunning = actionName => {
    return !!_store.state._runningActions?.has(actionName)
}

export const isComplete = actionName => {
    return !!_store.state._completedActions?.has(actionName)
}

export const doAfter = (actionName, func) => {
    return _store.state._runningActions?.get(actionName)?.promise?.then(func)
}

export const getPromise = actionName => {
    return _store.state._runningActions?.get(actionName)?.promise
}

export const waitOrDo = (actionName, func) => {
    const promise = _store.state._runningActions?.get(actionName)?.promise
    if(promise) promise.then(func)
    else func()
}

export const runOnce = (actionName, payload) => {
    if(!_store.state._completedActions?.has(actionName)) {
        return _store.dispatch(actionName, payload)
    }
}