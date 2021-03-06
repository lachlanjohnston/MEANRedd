// This file takes a set of posts and finds words
// which frequently occur together

// We retain word counts globally for candidate pair generation
// generated by parseComments() and postData() (getData.js)

// note there are major ways we could reduce the 
// memory usage throughout these files

var support = 0 // default
maxSetSize = 5

onmessage = generateCandidatePairs;

function generateCandidatePairs(message) {
    
    topWordRankings = message.data.topWords;
    support = message.data.support;
    
    pairs = [];
    
    for (word_x of topWordRankings) {
        for (word_y of topWordRankings){
            
            if (word_x < word_y) {
                var pair = [word_x, word_y];

                pairs.push({
                    candidate: pair,
                    frequency: 0
                });
            }
        }
    }
    
    apriori(message.data.data);
}

// Takes the previous pruned candidate set
// and creates a candidate set where:
// |candidates| = |oldcandidates| + 1
function generateNextOrderSets(oldCandidates) {
    var candidates = [];
    
    for (oldCandidate of oldCandidates) {
        oldCandidate = oldCandidate.candidate
        
        topWordRankings.map( function (word) {
            
            if (word > oldCandidate[oldCandidate.length - 1]) {
                candidates.push({
                    candidate: [...oldCandidate, word],
                    frequency: 0
                });
            }
        });
    }
    
    return candidates;
}

function isSubset(xs, ys) {
    ys = new Set(ys);
    
    return xs.map(x => ys.has(x))
        .every(x => x == true);
}

function maximalPrune(frequentSets, candidates) {
    
    frequentSets = frequentSets.filter( function (subset) {
        for (candidate of candidates)
            if (isSubset(subset.candidate, candidate.candidate))
                return false;
        return true
    })
    
    return frequentSets;
}

function apriori(data) {
    var frequentSets = [];
    var prevCandidates = [];
    var candidates = pairs;
    
    // transform words to baskets
    var baskets = Object.keys(data)
        .map(sr => data[sr])
        .map(sr => sr.map(post => post.words))
        .reduce((sr1, sr2) => [...sr1, ...sr2]);
    
        // set support
    if (support == 0)
        support = baskets.length * 0.05;
    
    k = 0
    
    console.log(support)
    
    while (candidates.length && k < maxSetSize) {
        
        for (basket of baskets) {
            
            // if the set of words exists in the post, 
            // increment its count
            for (candidate of candidates) {
                var c = candidate.candidate;
                if (isSubset(c, basket)) candidate.frequency += 1
            }
        }
        
        // we could prune here, but for now we're
        // keeping all sets > 0
        
        candidates = candidates.filter(c => c.frequency > support)
        
		//TODO: add this back for pruning output
        //frequentSets = maximalPrune(frequentSets, candidates);
        
        candidates.map(c => frequentSets.push(c))
        
        if (candidates.length)
            candidates = generateNextOrderSets(candidates);
        
        k++;
    }
    
    postMessage({ 
        edgeList: frequentSets.filter(a => a.candidate.length == 2), 
        frequentSets: frequentSets,
        support: support
    });
}


