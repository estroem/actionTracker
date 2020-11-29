let _store
let doAfterSingletons = new Set()

export default store => {
    _store = store
    store.state.__actionTracker_runningActions = new Map()
    store.state.__actionTracker_completedActions = new Set()
    Object.keys(store._actions).forEach(name => {
        const func = store._actions[name][0]
        store._actions[name][0] = payload => {
            if(store.state.__actionTracker_runningActions.has(name)) {
                const existing = store.state.__actionTracker_runningActions.get(name)
                const newPromise = func(payload)
                const allPromise = Promise.all([existing, newPromise])
                allPromise.finally(() => {
                    if(store.state.__actionTracker_runningActions.get(name) === allPromise) {
                        store.state.__actionTracker_runningActions.delete(name)
                        store.state.__actionTracker_completedActions.add(name)
                    }
                })
                store.state.__actionTracker_runningActions.set(name, allPromise)
                return newPromise
            } else {
                const promise = func(payload)
                promise.finally(() => {
                    if(store.state.__actionTracker_runningActions.get(name) === promise) {
                        store.state.__actionTracker_runningActions.delete(name)
                        store.state.__actionTracker_completedActions.add(name)
                    }
                })
                store.state.__actionTracker_runningActions.set(name, promise)
                return promise
            }
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
    return _store.state.__actionTracker_runningActions?.get(actionName)?.then(func)
}

export const doAfterOnce = (actionName, id, func) => {
    if(!doAfterSingletons.has(id)) {
        doAfterSingletons.add(id)
        return _store.state.__actionTracker_runningActions?.get(actionName)?.then(() => {
            func()
            doAfterSingletons.delete(id)
        })
    }
}

export const getPromise = actionName => {
    return _store.state.__actionTracker_runningActions?.get(actionName)
}

export const waitOrDo = (actionName, func) => {
    const promise = _store.state.__actionTracker_runningActions?.get(actionName)
    if(promise) promise.then(func)
    else func()
}

export const runOnce = (actionName, payload) => {
    if(!_store.state.__actionTracker_runningActions?.has(actionName)
            && !_store.state.__actionTracker_completedActions?.has(actionName)) {
        return _store.dispatch(actionName, payload)
    }
}