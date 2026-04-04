'use client';

import { JourneyPlayer } from '@/components/audio/JourneyPlayer';

/**
 * Journey Player Page
 *
 * A dedicated page for the audio + read experience.
 * Users can listen to articles or read them while tracking progress.
 *
 * Design Philosophy (from Tanya):
 * - Focused, distraction-free experience
 * - Audio + Read mode toggle
 * - Journey context visible
 * - Minimal controls
 * - ONE primary action per screen
 */
export default function JourneyPlayerPage({
  params,
}: {
  params: { journeyId: string };
}) {
  // TODO: Fetch journey articles from database based on journeyId
  const mockArticles = [
    {
      id: '1',
      title: 'Introduction to Deep Learning',
      content: `
        Deep learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns in data.

        Each layer learns to transform the data in a way that makes it more useful for the next layer, building increasingly abstract representations.

        The fundamental building block is the artificial neuron, which takes inputs, applies weights, and produces an output through an activation function.

        Training these networks involves forward propagation to make predictions, and backpropagation to adjust weights based on errors.

        The power of deep learning comes from its ability to automatically learn feature representations from raw data, eliminating the need for manual feature engineering.

        This has led to breakthroughs in computer vision, natural language processing, and many other fields.
      `,
    },
    {
      id: '2',
      title: 'Understanding Neural Networks',
      content: `
        Neural networks are computing systems inspired by biological neural networks in the human brain.

        They consist of connected nodes or neurons organized in layers: an input layer, one or more hidden layers, and an output layer.

        Each connection has a weight that is adjusted during training to strengthen or weaken the signal between neurons.

        The network learns by example, processing training data and adjusting weights to minimize the difference between predicted and actual outputs.

        Activation functions introduce non-linearity, allowing networks to learn complex patterns and relationships in the data.

        Common activation functions include ReLU, sigmoid, and tanh, each with different properties suitable for different use cases.
      `,
    },
    {
      id: '3',
      title: 'Advanced Optimization Techniques',
      content: `
        Training deep neural networks requires sophisticated optimization algorithms to find the best set of weights.

        Stochastic Gradient Descent (SGD) updates weights using a random subset of training data, making it faster and more memory-efficient.

        Momentum helps accelerate SGD by adding a fraction of the previous update to the current one, helping to overcome local minima.

        Adaptive learning rate methods like Adam, RMSprop, and Adagrad automatically adjust the learning rate for each parameter.

        Learning rate scheduling involves changing the learning rate during training, starting high and decaying over time.

        Regularization techniques like dropout and batch normalization help prevent overfitting and improve generalization.
      `,
    },
    {
      id: '4',
      title: 'Convolutional Neural Networks',
      content: `
        Convolutional Neural Networks (CNNs) are specialized neural networks designed for processing grid-like data such as images.

        They use convolutional layers that apply learnable filters to the input, detecting features like edges, textures, and shapes.

        Pooling layers reduce the spatial dimensions, making the network more computationally efficient and robust to small translations.

        The architecture typically consists of several convolutional and pooling layers followed by fully connected layers for classification.

        CNNs have achieved state-of-the-art performance in image classification, object detection, and many computer vision tasks.

        Pre-trained CNNs can be used as feature extractors or fine-tuned for specific tasks through transfer learning.
      `,
    },
    {
      id: '5',
      title: 'Recurrent Neural Networks',
      content: `
        Recurrent Neural Networks (RNNs) are designed to process sequential data by maintaining an internal state or memory.

        They process inputs one at a time, with the hidden state acting as a summary of all previous inputs in the sequence.

        This makes them suitable for tasks like language modeling, speech recognition, and time series prediction.

        However, standard RNNs struggle with long-term dependencies due to the vanishing gradient problem.

        Long Short-Term Memory (LSTM) networks address this with specialized memory cells and gating mechanisms.

        Gated Recurrent Units (GRUs) are a simplified alternative to LSTMs that maintain similar performance with fewer parameters.
      `,
    },
    {
      id: '6',
      title: 'Transformers and Attention',
      content: `
        The Transformer architecture revolutionized natural language processing by replacing recurrent layers with attention mechanisms.

        Self-attention allows each position in a sequence to attend to all other positions, capturing long-range dependencies.

        The transformer consists of an encoder that processes the input and a decoder that generates the output.

        Multi-head attention enables the model to attend to different representation subspaces at different positions.

        Positional encoding provides information about the order of tokens since the architecture itself is permutation invariant.

        Pre-trained transformer models like BERT and GPT have achieved remarkable results across a wide range of NLP tasks.
      `,
    },
  ];

  return (
    <JourneyPlayer
      journeyId={params.journeyId}
      articles={mockArticles}
      currentArticleIndex={0}
    />
  );
}
