---
title: 'Towards Automated Circuit Discovery - novice implementation'
author: Aleks Hiidenhovi
published: 2024-09-10
---

This is my course project for the AI Safety Fundamentals course, summer 2024. In this notebook, I attempt to reproduce the experiments in the paper [*Towards Automated Circuit Discovery for Mechanistic Interpretability*](https://arxiv.org/pdf/2304.14997) which studies automated ways of uncovering computational graphs in small transformer models.

## Paper walkthrough

The core motivation for this paper is to take the first steps in automating circuit discovery which has previously involved extensive manual handwork and iteration.

### What are circuits?
According to [Olah et al.](https://distill.pub/2020/circuits/zoom-in), a *circuit* is a subgraph of a neural network. It consists of a set of fundamentals units called *features* that are connected with *weighted edges*.

In transformer models specifically, a feature could be as small as a single neuron, but more often we are interested in larger sub-units of the network, such as attention heads or MLP layers. The invidual units, and moreover the whole networks, are connected together by the [*residual stream*](https://transformer-circuits.pub/2021/framework/index.html#residual-comms).

### Automating the workflow
Before this paper was announced, the general methodology for identifying circuits involved the following 3 manual steps:
1. **Task definition:** Recognizing a behavior or task that the model displayes, creating a dataset that reproduces that isolates and reproduces that behavior, and choosing a metric to measure how well the model performs at the task.
2. **Interpretation scoping:** Deciding the level of granularity (e.g. attention heads/MLPs, individual neurons, etc...) at which the network should be interpreted in.
3. **Manual discovery:** Performing extensive patching experiments in order to remove as many unnecessary sub-units and edges as possible.

The paper introducess an algorithm called Automatic Circuit DisCovery (ACDC), the goal of which is to fully automate step 3 of the process.

### ACDC algorithm
On the high-level, ACDC finds a circuit by iteratively pruning unimportant nodes from the network. More formally, the algorithm executes the following steps:
1. **Network sorting:** The network is topologically sorted in reverse, i.e. from output to input nodes.
2. **Iterative pruning:** The algorithm iterates every edge in the graph. It prunes a node if it is considered "unimportant" according to the threshold function (more on that next)
3. **Tree-shaking:** Some nodes in the network might end up in a dead end if all its parent edges are cut off. Tree-shaking removes these "dead nodes".

The final result is a subgraph of the network that only has nodes with a direct connection from the input, all the way to the output node.

![How ACDC works](https://drive.google.com/uc?id=1_UQWmoVuE61pC-PodD3SihNU7CnqzR3L)

More detailed information about the algorithm can be found Section 3 from the [paper](https://arxiv.org/pdf/2304.14997), and in the "Experiment section" of this post.

