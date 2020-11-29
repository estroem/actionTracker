let _store

export default store => {
    _store = store
    const actionNames = Object.keys(store._actions)
    store.state._runningActions = []
    actionNames.forEach(name => {
        const oldFunc = store._actions[name][0]
        store._actions[name][0] = payload => {
            const promise = oldFunc(payload)
            store.state._runningActions.push({ name, promise })
            promise.finally(() => {
                const index = store.state._runningActions.findIndex(a => a.name === name)
                if(index != -1) {
                    store.state._runningActions.splice(index, 1)
                }
            })
            return promise
        }
    })
}

export const isRunning = actionName => {
    return !!_store.state._runningActions?.find(action => action.name === actionName)
}

export const doAfter = (actionName, func) => {
    return _store.state._runningActions?.find(action => action.name === actionName)?.promise?.then(func)
}

export const getPromise = actionName => {
    return _store.state._runningActions?.find(action => action.name === actionName)?.promise
}