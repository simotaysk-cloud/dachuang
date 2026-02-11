Page({
    data: {
        info: {}
    },

    onLoad(options) {
        if (options.data) {
            try {
                const info = JSON.parse(decodeURIComponent(options.data));
                this.setData({ info });
            } catch (e) {
                console.error("Failed to parse node info", e);
            }
        }
    }
});
